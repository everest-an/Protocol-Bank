# 為 AI 經濟注入新動力：Protocol Banks 流支付與 AI 開發平台集成戰略報告

**作者**: EverestAn
**日期**: 2025年11月1日

---

## 摘要

當前,以 Manus 為代表的 AI Agent 平台正處於爆發式增長前夜,但其普遍採用的“訂閱+Credits預付費”模式已成為用戶體驗和商業擴展的瓶頸。用戶面臨著“訂閱疲勞”、資金沉澱和階梯定價不靈活等多重痛點。本文深入分析了這一市場缺口,並指出 **Protocol Banks 所代表的流支付 (Streaming Payments) 技術,是解決 AI 平台按 token/按秒計費需求的天然方案**。

本報告詳細闡述了將 Protocol Banks 集成到 Manus 等 AI 平台的具體路徑。我們提出了一套“混合式流支付網關”的技術架構,旨在簡化集成難度,並實現“連接錢包,按秒付費”的無縫用戶體驗。更重要的是,我們發現 Protocol Banks 的 **Agent Market** 功能揭示了其成為 AI 經濟底層基礎設施的巨大潛力,遠不止於一個支付工具。

最後,本報告為 Protocol Banks 設計了包括交易手續費、平台即服務 (PaaS) 和生態系統分潤在內的三種商業模式,並規劃了以 Manus 為灘頭陣地,分四個階段逐步佔領市場的落地策略。我們認為,通過聚焦 AI 這一垂直領域,並發揮 Agent Market 的獨特優勢,Protocol Banks 有機會在與 Stripe、Coinbase 等巨頭的競爭中脫穎而出,成為 AI 經濟時代不可或缺的支付基礎設施。

---

## 第一章：市場機遇分析

### 1.1 AI 平台的支付困境：從 Manus 看當前模式的挑戰

AI Agent 和開發工具正在經歷快速的產品迭代和用戶增長,但其支付模式卻顯得相對傳統和滯後。以行業領先者 Manus 為例,其支付體系主要由月度/年度訂閱和 Credits 點數構成 [1]。

> Credits 是我們衡量 Manus 使用量的標準單位——任務越複雜或越長,需要的 Credits 就越多。
> — Manus 幫助中心 [2]

這種模式雖然為平台帶來了可預測的現金流,但給用戶帶來了顯著的痛點,這些痛點在 Reddit 等社區中被廣泛討論 [3]：

| 痛點 | 描述 | 用戶影響 |
|---|---|---|
| **預付費風險** | 用戶必須預先購買固定數額的 Credits,未使用的部分在月底清零,無法跨週期累積。 | 輕度用戶的資金被浪費,造成“花錢買了沒用”的負面體驗。 |
| **階梯定價不靈活** | 用戶只能在有限的幾個套餐中選擇,無法精確匹配其實際使用量。一個月的重度使用和下個月的輕度使用都可能被鎖定在同一高價套餐中。 | 用戶被迫為未來的“可能性”付費,而非為實際的“使用量”付費,性價比低。 |
| **訂閱疲勞** | 在SaaS 服務日益增多的今天,用戶對增加新的固定月費訂閱感到厭倦和抗拒。 | 降低了新用戶的轉化意願和老用戶的續費意願。 |
| **成本不透明** | Credits 的消耗與具體操作之間的關係不夠直觀,用戶難以預估任務成本,常常在任務結束後才發現 Credits 消耗巨大。 | 導致“賬單驚嚇” (Bill Shock),用戶對平台產生不信任感。 |

不僅是 Manus,包括 Cursor AI、Windsurf 在內的其他 AI 開發工具也普遍採用類似的“訂閱+用量包”模式 [4, 5]。這表明,整個 AI 工具市場都存在一個普遍的、尚未被滿足的需求: **一種更公平、更靈活、更透明的支付方式**。

### 1.2 流支付：為“按用量付費”而生的解決方案

流支付,這一概念最早由 Andreas M. Antonopoulos 提出,其核心是將傳統的批量轉賬 (lump-sum transfer) 變革為連續的價值流 (stream) [6]。基於 Sablier、Superfluid 等區塊鏈協議,資金可以像水流一樣,按秒從一個錢包流向另一個錢包。

Sablier 的文檔中明確指出了其兩種核心模式 [7]：
- **Lockup (鎖定型)**: 適用於 Vesting 等總量固定的場景。
- **Flow (流動型)**: 適用於薪資、補助金等需要靈活、持續支付的場景,**無需預先存入全部資金**。

**Sablier Flow 模式的特性與 AI 平台的支付需求形成了完美匹配**: AI 服務的消耗是連續且動態的,用戶理應為其使用的每一“token”、每一“秒”付費,而不是為一個預先打包好的“套餐”付費。流支付正是實現這種終極“Pay-as-you-go”模型的理想技術。

### 1.3 趨勢已來：Google 與 Coinbase 佈局 AI 支付

AI 與加密支付的結合已不僅是理論探討。2025年9月,Google Cloud 聯合 Coinbase、MetaMask 等行業巨頭,發布了 **Agent Payments Protocol (AP2)** [8]。

> AP2 協議旨在為用戶、商家和支付提供商建立一個與支付方式無關的框架,讓他們可以自信地跨所有支付類型進行交易。
> — Google Cloud Blog [8]

AP2 的核心是通過“授權書 (Mandates)”為 AI Agent 的自主支付行為提供可驗證的授權鏈條,並推出了專為加密貨幣設計的 x402 擴展。這標誌著科技巨頭已經預見到 AI Agent 自主進行經濟活動的未來,並開始著手構建相應的支付基礎設施。Protocol Banks 的探索方向與行業最前沿的趨勢完全一致,市場正在被教育,時機已經成熟。

---

## 第二章：技術集成方案

### 2.1 核心理念：“連接錢包,按秒付費”

我們為 AI 平台設計的集成方案,其核心是徹底顛覆傳統的“註冊-綁卡-預付費”流程,轉向 Web3 原生的“連接錢包,即用即付”新範式。用戶無需預先購買任何套餐,只需將自己的加密錢包連接到平台,即可根據實際使用量,按秒支付費用。

### 2.2 推薦架構：混合式流支付網關

為了降低 AI 平台的集成門檻,我們建議 Protocol Banks 提供一個“流支付網關” (Streaming Payment Gateway)。它應封裝底層區塊鏈的複雜性,對外提供簡潔的 API,同時具備多鏈支持、穩定幣優先、Gas 補貼和法幣出入金等關鍵特性。

#### 架構圖

```mermaid
graph TD
    subgraph AI Platform (e.g., Manus)
        A[用戶前端界面] --> B{AI Agent 服務};
        B --> C[用量計費模塊 (Token Counter)];
    end

    subgraph Protocol Banks Gateway
        D[支付網關 API];
        E[流支付合約 (Sablier/Superfluid-like)];
        F[Gas Tank 服務];
        G[法幣出入金 (On/Off-Ramp)];
    end

    subgraph Blockchain Network
        H[EVM 兼容鏈];
    end

    subgraph User
        I[用戶錢包 (e.g., MetaMask)];
    end

    A -- "1. 連接錢包" --> I;
    I -- "2. 授權支付上限" --> D;
    A -- "3. 發起 AI 任務" --> B;
    C -- "4. 實時上報用量" --> D;
    D -- "5. 創建/更新支付流" --> E;
    E -- "6. 在區塊鏈上執行流式支付" --> H;
    H -- "7. 資金從用戶錢包流向平台錢包" --> I;
    D -- "可選: 支付 Gas" --> F;
    A -- "可選: 購買加密貨幣" --> G;
```

### 2.3 支付流程詳解

1.  **首次使用 (Onboarding)**: 用戶在 Manus 平台連接錢包,並授權一個最高流速 (如 $0.01/分鐘) 和總支付上限 (如 $20)。此舉確保了用戶資金安全。
2.  **使用中 (Real-time Usage)**: 當用戶發起 AI 任務時,Manus 後端調用 Protocol Banks API 開啟一個支付流。隨著任務進行,用量計費模塊會實時計算 token 消耗,並動態調整流速。資金以秒為單位,從用戶錢包流向 Manus 平台錢包。
3.  **任務結束**: 任務完成後,支付流自動停止。

這種模式為用戶提供了極致的靈活性和控制權,支付過程在後台無縫進行,且每一筆微支付都清晰可查。

### 2.4 Protocol Banks 的獨特機會：Agent Market

在對 Protocol Banks 官網的探索中,我們發現了其 **Agent Market** 功能 [9]。該市場基於一個潛在的 AI Agent NFT 標準 (ERC-8004),並定義了多種 Agent 角色 (如 `Payment Executor`, `Validator`)。

這揭示了 Protocol Banks 的終極願景: **不僅是支付層,更是 AI 服務的發現、驗證和結算層**。這為與 Manus 的合作提供了超越支付的想象空間: Manus 可以成為市場上的“超級 Agent”供應商,而 Protocol Banks 則處理所有底層的支付、分潤和結算,共同構建一個繁榮的 AI Agent 生態。

---

## 第三章：商業合作與落地路徑

### 3.1 商業合作模式

Protocol Banks 應為 AI 平台提供靈活的、可演進的合作方案:

| 合作模式 | 描述 | 適用對象 |
|---|---|---|
| **交易手續費** | 從每筆流支付中抽取 0.3%-0.5% 的費用。 | 所有 AI 平台,作為基礎合作模式。 |
| **平台即服務 (PaaS)** | 提供包含 Gas 補貼、法幣通道、白標方案等增值服務的月度訂閱套餐。 | 需要深度集成和定製化服務的大型平台,如 Manus。 |
| **生態系統分潤** | 在 Agent Market 的交易中,抽取平台費用 (e.g., 5%),並為 Agent 開發者和平台方提供自動分潤。 | 所有希望將其 AI 服務市場化的平台。 |

### 3.2 落地路徑：四步走戰略

我們建議以 Manus 為切入點,採用“灘頭陣地 -> 樣板工程 -> 全面推廣 -> 生態建設”的策略。

1.  **第一步: 接觸與提案 (1-2週)**: 準備針對性提案,直擊 Manus 當前支付模式的痛點,並展示流支付的優勢和 Agent Market 的合作願景。
2.  **第二步: 技術驗證 (PoC) (1-2個月)**: 與 Manus 技術團隊合作,針對特定功能或用戶群,完成小規模的技術可行性驗證。
3.  **第三步: 灰度上線與優化 (2-3個月)**: 向小部分真實用戶開放流支付選項,收集反饋,迭代產品,並驗證市場反應。
4.  **第四步: 全面推廣與生態建設 (長期)**: 將流支付作為官方選項全面上線,將 Manus 案例打造成行業標杆,並正式啟動 Agent Market 生態。

### 3.3 競爭分析與差異化

| 競爭對手 | 優勢 | 劣勢 | Protocol Banks 差異化策略 |
|---|---|---|---|
| **Stripe** | 品牌強大,集成簡單 | 中心化,非流式,費用較高 | **按秒計費**: 強調支付的極致顆粒度和對用戶的公平性。 |
| **Coinbase Commerce** | 用戶基數大,信任度高 | 主要用於一次性支付,流支付支持弱 | **聚焦 AI**: 提供專為 AI 場景設計的解決方案 (Gas Tank, Agent Market)。 |
| **Superfluid/Sablier** | 流支付技術領先,開源 | 僅為底層協議,缺乏商業級服務 | **商業級網關**: 提供企業級的 API、支持和服務,做“商業版的 Superfluid”。 |

**核心差異化**: Protocol Banks 的制勝關鍵在於 **避免成為一個通用的加密支付網關**,而是 **將自己定位為“AI 經濟的專屬支付基礎設施”**。Agent Market 是實現這一定位的決定性武器。

---

## 第四章：結論與建議

AI 平台的崛起為支付領域帶來了全新的挑戰和機遇。傳統的訂閱和預付費模式已無法滿足 AI 服務“按用量付費”的內在需求。流支付技術的出現,為解決這一矛盾提供了完美的答案。

Protocol Banks 正處於一個極佳的歷史節點。我們強烈建議:

1.  **聚焦 AI 賽道**: 將 AI 開發平台作為核心目標客戶,集中資源解決其特定痛點。
2.  **完善開發者工具**: 儘快發布詳細的 API 文檔和 SDK,降低 AI 平台的集成門檻。
3.  **主動出擊**: 立即啟動針對 Manus 的接觸計劃,將其發展為第一個標杆客戶。
4.  **大力發展 Agent Market**: 將 Agent Market 作為核心戰略,構建長期的生態護城河。

通過將先進的流支付技術與對 AI 經濟的深刻理解相結合,Protocol Banks 完全有潛力成為下一代互聯網的關鍵基礎設施,為一個更加開放、公平和高效的 AI 服務市場提供動力。

---

## 參考資料

[1] Manus. (2025). *Manus Plans & Pricing*. Retrieved from https://manus.im/pricing
[2] Manus. (2025). *What are credits?*. Retrieved from https://manus.im/help/credits
[3] Reddit. (2025). *The current Manus credit system is unreasonably expensive*. Retrieved from https://www.reddit.com/r/ManusOfficial/comments/1jnh9ah/the_current_manus_credit_system_is_unreasonably/
[4] Cursor. (2025). *Pricing*. Retrieved from https://cursor.com/pricing
[5] Windsurf. (2025). *Pricing*. Retrieved from https://windsurf.com/pricing
[6] Antonopoulos, A. M. (2016). *Money as a Content Type and Streaming Money*. Retrieved from YouTube.
[7] Sablier. (2025). *Use Cases*. Retrieved from https://docs.sablier.com/concepts/use-cases
[8] Google Cloud. (2025). *Announcing Agent Payments Protocol (AP2)*. Retrieved from https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
[9] Protocol Banks. (2025). *Agent Market*. Retrieved from https://www.protocolbanks.com/#/agent-market
