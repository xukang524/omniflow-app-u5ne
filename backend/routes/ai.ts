import { Router, Request, Response } from 'express';
import { createAIService } from '../services/aiService';
import type {
  Critique,
  DebateAnalysis,
  DebateStreamEvent,
  Dispute,
  DisputeSeverity,
} from '../../shared/types/api';

const router = Router();

const PERSONAS: Record<string, { name: string; prompt: string }> = {
  reasoner: {
    name: '严谨推理者',
    prompt: '你是一位严谨的逻辑推理型分析师，擅长分步骤推导，给出明确的结论和关键依据。',
  },
  skeptic: {
    name: '批判质疑者',
    prompt: '你是一位批判性思维的分析师，擅长指出常见误区、不确定性和反面证据，给出审慎的判断。',
  },
  data: {
    name: '数据分析师',
    prompt: '你是一位数据驱动的分析师，擅长引用具体数字、统计口径和权威机构数据，并说明数据来源的局限。',
  },
  practitioner: {
    name: '实务专家',
    prompt: '你是一位经验丰富的行业实务专家，擅长从真实场景和落地约束出发回答问题。',
  },
  futurist: {
    name: '趋势观察者',
    prompt: '你是一位着眼未来的趋势观察者，擅长对比多种情景并指出关键变量。',
  },
};

const ANSWER_RULES =
  '请独立作答，使用与用户问题相同的语言，控制在220字以内，直接给出你的核心结论、关键数字或判断，并简要说明依据。不要寒暄。';

function clampConfidence(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAnalysis(raw: string, answers: Record<string, string>): DebateAnalysis {
  const ids = Object.keys(answers);
  const empty: DebateAnalysis = { disputes: [], critiques: [], confidences: {}, consensus: '' };
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  let parsed: Record<string, unknown> = {};
  if (start >= 0 && end > start) {
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch (error) {
      console.warn('Failed to parse analysis JSON');
    }
  }

  const confRaw = (parsed.confidences || {}) as Record<string, unknown>;
  const confidences: Record<string, number> = {};
  ids.forEach((id) => {
    confidences[id] = clampConfidence(confRaw[id], 75);
  });

  const severities: DisputeSeverity[] = ['high', 'medium', 'low'];
  const disputes: Dispute[] = (Array.isArray(parsed.disputes) ? parsed.disputes : [])
    .slice(0, 4)
    .map((d: any, i: number): Dispute => ({
      id: `d${i + 1}`,
      title: String(d?.title || `分歧 ${i + 1}`),
      severity: severities.includes(d?.severity) ? d.severity : 'medium',
      summary: String(d?.summary || ''),
      positions: (Array.isArray(d?.positions) ? d.positions : [])
        .filter((p: any) => ids.includes(p?.modelId))
        .map((p: any) => ({ modelId: String(p.modelId), claim: String(p.claim || '') })),
    }));

  const critiques: Critique[] = (Array.isArray(parsed.critiques) ? parsed.critiques : [])
    .filter((c: any) => ids.includes(c?.from) && ids.includes(c?.to) && c.from !== c.to)
    .slice(0, 12)
    .map((c: any) => ({ from: String(c.from), to: String(c.to), comment: String(c.comment || '') }));

  return { ...empty, disputes, critiques, confidences, consensus: String(parsed.consensus || '') };
}

function overallConfidence(analysis: DebateAnalysis): number {
  const values = Object.values(analysis.confidences);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 70;
  const penalty = analysis.disputes.reduce(
    (sum, d) => sum + (d.severity === 'high' ? 6 : d.severity === 'medium' ? 3 : 1),
    0,
  );
  return Math.max(30, Math.min(97, Math.round(avg - penalty)));
}

router.post('/debate', async (req: Request, res: Response) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const requested: unknown = req.body?.modelIds;
  const modelIds = Array.isArray(requested)
    ? Array.from(new Set(requested.filter((id): id is string => typeof id === 'string' && !!PERSONAS[id])))
    : [];

  if (!question || question.length > 2000) {
    return res.status(400).json({ success: false, error: '请输入 1-2000 字的问题' });
  }
  if (modelIds.length < 2 || modelIds.length > 5) {
    return res.status(400).json({ success: false, error: '请选择 2-5 个模型参与辩论' });
  }

  try {
    const ai = createAIService();
    const appLink = req.get('Referer') || req.get('Origin') || `${req.protocol}://${req.get('host')}`;

    // Vercel needs a brief async pause before SSE headers to enter streaming mode.
    await new Promise((resolve) => setTimeout(resolve, 50));
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let closed = false;
    req.on('close', () => {
      closed = true;
    });
    const send = (event: DebateStreamEvent) => {
      if (!closed && !res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Round 1: independent streamed answers in parallel
    send({ type: 'stage', stage: 'answering' });
    const answers: Record<string, string> = {};
    await Promise.all(
      modelIds.map(async (modelId) => {
        let text = '';
        try {
          const system = `${PERSONAS[modelId].prompt}${ANSWER_RULES}`;
          for await (const chunk of ai.chatDefault(question, system, appLink)) {
            if (closed) return;
            text += chunk;
            send({ type: 'chunk', modelId, content: chunk });
          }
          if (text) answers[modelId] = text;
          send({ type: 'model_done', modelId });
        } catch (error) {
          console.error('Model answer failed:', modelId, error);
          send({ type: 'model_error', modelId, message: '该模型暂时无法回答' });
        }
      }),
    );

    const answeredIds = Object.keys(answers);
    if (closed) return;
    if (answeredIds.length < 1) {
      send({ type: 'error', message: '所有模型均未能返回回答，请稍后重试' });
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Round 2: cross-critique and dispute detection
    send({ type: 'stage', stage: 'analyzing' });
    const answersBlock = answeredIds
      .map((id) => `【${id}（${PERSONAS[id].name}）的回答】\n${answers[id]}`)
      .join('\n\n');
    const analysisSystem =
      '你是一位公正的AI辩论裁判。阅读各AI对同一问题的回答，找出它们在事实、数据或结论上的分歧，并让每个AI评价其他AI的回答。只输出一个JSON对象，不要输出任何其他文字。';
    const analysisPrompt = `用户问题：${question}\n\n${answersBlock}\n\n可用的modelId：${answeredIds.join(', ')}\n\n请输出JSON，格式严格如下（使用简体中文内容）：\n{"confidences":{"<modelId>":0-100的整数，表示该回答的可信度},"disputes":[{"title":"分歧标题","severity":"high|medium|low","summary":"分歧说明，60字内","positions":[{"modelId":"<modelId>","claim":"该模型在此分歧上的原始主张，60字内"}]}],"critiques":[{"from":"<modelId>","to":"<modelId>","comment":"from对to的具体评价或纠错，60字内"}],"consensus":"各方一致认同的要点，80字内"}\n最多3个分歧，最多${Math.min(answeredIds.length * 2, 8)}条互评。如果没有明显分歧，disputes返回空数组。`;

    let analysis: DebateAnalysis;
    try {
      const raw = await ai.chat(analysisPrompt, analysisSystem, appLink);
      analysis = parseAnalysis(raw, answers);
    } catch (error) {
      console.error('Analysis failed:', error);
      analysis = parseAnalysis('', answers);
    }
    send({ type: 'analysis', analysis });

    // Round 3: streamed synthesis
    send({ type: 'stage', stage: 'synthesizing' });
    const disputeBlock = analysis.disputes.length
      ? analysis.disputes.map((d) => `- [${d.severity}] ${d.title}：${d.summary}`).join('\n')
      : '- 暂未发现明显分歧';
    const synthSystem =
      '你是综合裁决者，需要在各AI相互纠错后给出最优答案。使用与用户问题相同的语言，先给出结论，再说明对主要争议点的取舍理由，并明确指出仍需用户核查的信息。控制在350字以内，可以使用简短的分段。';
    const synthPrompt = `用户问题：${question}\n\n${answersBlock}\n\n已识别的争议点：\n${disputeBlock}\n\n共识：${analysis.consensus || '无'}`;
    try {
      for await (const chunk of ai.chatDefault(synthPrompt, synthSystem, appLink)) {
        if (closed) return;
        send({ type: 'final_chunk', content: chunk });
      }
    } catch (error) {
      console.error('Synthesis failed:', error);
      send({ type: 'error', message: '综合答案生成失败，请重试' });
    }
    send({ type: 'final', confidence: overallConfidence(analysis) });
    send({ type: 'stage', stage: 'done' });
    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Debate error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

export default router;
