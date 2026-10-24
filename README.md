# 智辨AI汇

让多个AI视角对同一问题并行作答、相互纠错、标注争议点,并生成带置信度的综合答案。

## 技术栈

React + Vite + Tailwind v4 + shadcn/ui + HashRouter;Express 后端;SSE 流式输出(平台 AIService)。

## 已完成的核心功能

- `/` 工作台:选择 2-5 个模型席位 → 输入问题 → 各模型流式并行作答 → 互评与争议识别 → 综合最优答案(含置信度)
  - 阶段进度条、停止/重新发起、新问题、复制综合答案、字数统计、示例问题
  - 移动端:底部固定输入栏(含安全区)、44px 触控目标、争议详情以底部抽屉展示
- 争议详情溯源抽屉:查看各模型原始论据与相互纠错内容(桌面右侧抽屉 / 移动端底部抽屉)
- `/admin` 管理后台:成本统计、模型配置(添加/编辑/启停,表单内联校验,移动端卡片列表)、成本占比与调用量图表(演示数据)

## 目录结构

- `frontend/src/pages/Index.tsx` 工作台;`Admin.tsx` 后台;`NotFound.tsx`
- `frontend/src/components/custom/` AppNavbar、ModelPicker、ModelAnswerCard、DisputePanel、DisputeDrawer
- `frontend/src/hooks/useDebate.ts` 辩论状态机(含 stopped 状态);`frontend/src/lib/debateApi.ts` SSE 客户端
- `frontend/src/config/models.ts` 模型席位配置
- `backend/routes/ai.ts` 辩论接口;`shared/types/api.ts` 共享类型

## 接口

- `POST /api/ai/debate` — SSE 流,事件类型见 `shared/types/api.ts`

各“模型”为平台模型下的不同分析视角(通过角色提示区分),真正的多厂商模型接入为后续计划。

## 待办

历史记录保存、用户登录、点赞/更可信反馈、PDF 导出与分享链接、管理后台配置持久化。
