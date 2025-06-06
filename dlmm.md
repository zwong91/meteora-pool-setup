Meteora DLMM  所有流动性仅用于交易， 没有借贷收益。

Dynamic Liquidity Market Maker (DLMM) 动态流动性做市商 ， 让流动性提供者 (LPs) 尽可能多地利用其资本赚取费用。

Trader Joe's Liquidity Book 
asset pair 资产对的流动性组织成离散的价格区间，  聚合所有离散的流动性区间建立起来资产对市场。

DLMM 也是 DLMM Launch Pool 背后的基础系统。DLMM Launch Pool 是一种为新代币发行设计的池类型

Features：
* 通过在当前市场价值附近集中代币，支持高交易量的充足的流动性
* zero slippage 每个活跃区间内零滑点，交易量和费用更高
* Flexibility 波动性策略 根据市场条件和流动性提供者（LP）的目标/风险特征，解锁更多机会以收取更高的费用。
* LP 还可以仅使用一种代币提供单边流动性，初期无需提供大量的 USDC 或 SOL 来引导流动性
* Dynamic fees 动态调整费用


通过在不同价格点分配不同数量的代币 choose a liquidity shape：
* Spot 提供了一种均匀流动性分布，具有多功能性和风险调整，适合任何类型的市场和条件,类似于设置集中流动性做市商（CLMM）价格区间, 希望减少再平衡频率。
* Curve 分配在价格区间的中间非常适合集中式方法，旨在最大化效率，同时最小化波动的影响, 适合稳定币或价格变化不频繁的交易, 持续re-balance。
* Bid-ask 买卖差价分配区间的两端是一种反向 Curve 分布，通常单侧部署用于 DCA 定投进出仓位策略。它可以用于捕捉稳定或挂钩交易对中的波动, 风险最高。


| Strategy 策略 | Advantages 优势 | Disadvantages 劣势 | Considerations 考虑事项 |
|---------------|----------------|---------------------|--------------------------|
| **Curve 曲线** | Capital-efficient deployment of liquidity；资本高效的流动性部署。适合平稳市场。Ideal for calm markets. | Increased risk of impermanent loss；增加了暂时性损失的风险。 | Requires consistent rebalancing based on current price；需要根据当前价格持续进行再平衡。 |
| **Bid-Ask 买卖差价** | Captures market volatility；捕捉市场波动。Great for DCA in/out of positions；非常适合进行定投进出仓位。 | Riskier than other positions；比其他头寸风险更高。 | Requires rebalancing to remain efficient；需要重新平衡以保持效率。 |
| **Spot-Concentrated 集中现货** | Liquidity equally deposited between 1–3 bins；流动性在 1–3 个区间之间均匀分配。<br>Ideal for stablecoin pairs；适合稳定币交易对。Maximizes asset efficiency；最大化资产效率。 | Highest risk of impermanent loss when price leaves the bin range；当价格离开区间时，面临最高的无常损失风险。 | Useful for assets with tight price ranges；适用于价格波动较小的资产。 |
| **Spot-Spread 扩散现货** | Liquidity equally distributed between 20–30 bins；流动性在 20–30 个区间之间均匀分配。<br>Very capital-efficient strategy；非常资本高效的策略。<br>Expected to stay in range for small intra-day volatility；适合小幅日内波动。 | High risk of impermanent loss；面临高风险的暂时性损失。 | Make sure to monitor position at least on a daily basis；确保至少每天监控一次头寸。 |
| **Spot-Wide 宽幅现货** | Liquidity equally distributed between 50 bins；在 50 个区间之间均匀分布流动性。<br>Lower risk of impermanent loss；较低的无常损失风险。<br>Ideal for LPs who don’t want to monitor frequently；适合不愿频繁监控价格波动的流动性提供者。 | Reduced capital efficiency due to wide spread；由于分布范围大，资本效率降低。 | Still better than x*y=k AMMs in most cases；尽管效率较低，但通常仍优于 x*y=k 式交易模型。 |



***  important for LPs to closely monitor their positions  LP密切监控头寸并根据市场情况进行调整， 管控风险损失***



Concentrated Liquidity  集中流动性， 在指定的价格范围内提供流动性。

如 USDC/USDT，交易通常发生在$0.99 - $1.01 之间。通常，这个范围之外的流动性是未被触及的，LPs 无法赚取费用。


All bins except for the active one 除了活跃的箱子赚取交易费用， 其他箱子只包含一种类型的代币X或Y（被耗尽或在等待使用）

Bin Price 每个区间内X + Y = k。基本上，你可以添加 X 个代币并取出 Y 个代币（或反之），直到只剩下 1 种代币。

** bin step ** 每个区间代表一个单一的价格点，两个连续区间之间的差异就是区间步长(箱步)，每个箱子代表一个单一的价格点，两个连续箱子之间的差异就是箱步，类似于最小变动价位
如，以 SOL/USDC， 假设当前价格为 20 美元，区间步长为 25 个基点（0.25%），那么连续的区间将是 20 x 1.0025 = 20.05，20.05 * 1.0025 = 20.10，以此类推。
一般的经验法则是，对于稳定的交易对使用较小的步长，对于波动性较大的交易对使用较大的步长。

Liquidity pools identified 资产 X、资产 Y 和区间步长 s: (X, Y, s)


Bin Liquidity 区间流动性
P=Δx/Δy  直线的斜率常量， Token Y 和 Token X 储备变化
Token X + Token Y = L  流动性数量


Bin Composition  箱子组成 factor c 可用的储备
c≡ y / L
y=cL
x=L/P (1−c)


Market Aggregation  市场聚合
活动价格区间被定义为同时包含 X 和 Y 储备的区间。任何时候只能有一个活动区间。
活动区间左侧的所有区间将仅包含代币 Y，而右侧的所有区间将仅包含代币 X。
X 或 Y 代币的储备被耗尽时，当前价格将移动到左侧或右侧的下一个区间。

如  SOL/USDC 池， 资产 Y 指定为 USDC，将资产 X 指定为 SOL。Price P 由每个 SOL 所需的 USDC 数量决定。
将 $100 SOL 区间定义为活跃区间，左侧的所有区间仅包含 USDC，右侧的所有区间仅包含 SOL。
对 SOL 的需求显著时，$100 区间中的 SOL 储备被耗尽， 活跃区间会向右移动，



dynamic fees = base fee + variable fee
Base Fee池创建者配置， B * s 区间步长

Variable Fee  可变费用，交换频率以及跨多个区间的交换波动迭代计算， Volatility Accumulator 波动性累积器捕捉瞬时波动性

> 一个 bin $f_v(k)$ 的可变费用将使用可变费用控制参数 ($A$)、bin 步长 ($s$) 和波动性累加器 ($v_a(k)$) 计算：

$$
f_v(k) = A(v_a(k) \cdot s)^2
$$


> 将波动率累加器 $v_a(k)$ 视为当前代币对波动性的见证。在每个计算步骤之间，这个值将保存在内存中。它是在交换过程中计算的，并依赖于两个因素：

- **Volatility Reference ($v_r$)** from the previous swaps  
  > 来自之前交换的波动率参考 ($v_r$)

- **Introduced Volatility ($|i_r - (activeID + k)|$)**  
  > 引入波动性 ($|i_r - (activeID + k)|$)

**Volatility Accumulator：波动率累积器：**

$$
v_a(k) = v_r + |i_r - (activeID + k)|
$$

*(Note: $activeID$ is the ID of the active bin before the swap is made.)*  
> **注意：** $activeID$ 是交换前活动 bin 的 ID。

> 波动率参考 ($v_r$) 取决于自上次交易 ($t$) 以来经过的时间。我们将定义一个具有上下限的窗口。该窗口的下限定义为过滤周期 ($t_f$)，上限定义为衰减周期 ($t_d$)。

---

**If** $t$ is smaller than the filter period ($t_f$) *(this indicates a high frequency of transactions occurring)*,  
**then** $v_r$ stays the same.

> 如果 $t$ 小于过滤周期 ($t_f$)（这表明交易发生频率较高），则 $v_r$ 保持不变。

---

**If** $t$ is greater than the decay period ($t_d$) *(this indicates a low frequency of transactions occurring)*,  
**then** $v_r$ is reset to 0.

> 如果 $t$ 大于衰减周期 ($t_d$)（这表明交易发生频率较低），则 $v_r$ 重置为 0。

---

**If** $t$ is within the window bounded by $t_f$ & $t_d$,  
**then** $v_r$ takes the previous value of $v_a$ decayed by a factor $R$.

> 如果 $t$ 在 $t_f$ 和 $t_d$ 界定的窗口内，则 $v_r$ 取 $v_a$ 的前一个值，并按 $R$ 的因子衰减。
$$
v_r =
\begin{cases}
v_r, & t < t_f \\
R \cdot v_a, & t_f \leq t < t_d \\
0, & t_d \leq t
\end{cases}
$$


> 引入一个新变量，索引参考（$i_r$）来计算交易引入的波动性。在大多数情况下，$i_r$ 将是交换前活跃区间的 ID。在高频交易时，$i_r$ 将保持其旧值。这样做将有助于防止人们通过进行小额交易来操纵费用，从而导致价格的波动。

$$
i_r =
\begin{cases}
i_r, & t < t_f \\
\mathit{activeID}, & t_f \leq t
\end{cases}
$$


* Volatility Accumulator: $v_a(k) = v_r + |i_r - (activeID + k)|$
    * 波动累积器: $v_a(k) = v_r + |i_r - (activeID + k)|$

* $t$ is time elapsed since last transaction
    * $t$ 是自上次交易以来经过的时间

* $t_f$ is filter period
    * $t_f$ 是过滤周期

* $t_d$ is decay period
    * $t_d$ 是衰减周期

* $R$ is the factor that decays $v_a$, the volatility accumulator $R \cdot v_a$ when $t_f \leq t < t_d$
    * $R$ 是衰减 $v_a$ 的因子, 当 $t_f \leq t < t_d$ 时, 波动性累积器 $R \cdot v_a$

Let $t_f = 1$ sec, $t_d = 5$ secs, $R = 0.5$ sec, and active bin ID is 100.
设 $t_f = 1$ 秒, $t_d = 5$ 秒, $R = 0.5$ 秒, 活动箱 ID 为 100。

**Swap 1 交换 1**
You make a trade that crosses +3 bins to 103. So $0 \le k \le 3$

您进行了一笔交易，跨越 +3 个箱子到 103。因此 $0 \le k \le 3$

$i_r = 100$

$v_r = 0$

$v_a(0) = 0 + |100 - (100 + 0)| = 0$

$v_a(1) = 0 + |100 - (100 + 1)| = 1$

$v_a(2) = 0 + |100 - (100 + 2)| = 2$

$v_a(3) = 0 + |100 - (100 + 3)| = 3$

At the end of swap 1, $v_a = 3$.
在交换 1 结束时，$v_a = 3$。

**Swap 2 交换 2**
Alice makes a trade 4 seconds later that crosses +5 bins to 108. As $t=4$, $v_r = R \cdot v_a$. So $0 \le k \le 5$:

Alice在 4 秒后进行了一笔交易，跨越了+5 个区间到达 108。因为 $t=4$， $v_r = R \cdot v_a$。所以 $0 \le k \le 5$：

$i_r = 103$

$v_r = 0.5 \cdot 3 = 1.5$

$v_a(0) = 1.5 + |103 - (103 + 0)| = 1.5$

$v_a(1) = 1.5 + |103 - (103 + 1)| = 2.5$

$v_a(2) = 1.5 + |103 - (103 + 2)| = 3.5$

$\cdots$

$v_a(5) = 1.5 + |103 - (103 + 5)| = 6.5$

At the end of swap 2, $v_a = 6.5$.
在交换 2 结束时，$v_a = 6.5$。

**Swap 3 交换 3**
Bob makes a trade 0.3 seconds later that crosses -2 bins to 106. As $t=0.3$, which is $<t_f$ of 1 second, $i_r$ and $v_r$ stays the same. So $-2 \le k \le 0$:

Bob在 0.3 秒后进行了一笔交易，跨越 -2 个箱子到达 106。作为 $t=0.3$，即 $<t_f$ 的 1 秒，$i_r$ 和 $v_r$ 保持不变。所以 $-2 \le k \le 0$：

$i_r = 103$

$v_r = 1.5$

$v_a(0) = 1.5 + |103 - (108 + 0)| = 6.5$

$v_a(-1) = 1.5 + |103 - (108 - 1)| = 5.5$

$v_a(-2) = 1.5 + |103 - (108 - 2)| = 4.5$

At the end of swap 3, $v_a = 4.5$.
在交换 3 结束时，$v_a = 4.5$。




DLMM 协议费用 Protocol Fee = a percentage of the Dynamic Fee (total swap fee i.e. base + variable fee).
5% of the Dynamic Fee for all standard DLMM Pools
20% of the Dynamic Fee for DLMM Bootstrapping Pools (Launch Pools)



Farming Rewards 挖矿奖励一旦您在覆盖**活动区间**的价格范围内存入流动性，您就开始获得 DLMM 农业奖励。每秒固定的速率分配， 要手动领取农场奖励。

create a farm 申请



DLMM Launch Pool 为新代币发行设计的池类型。
https://docs.meteora.ag/token-launch-pools/steps-to-create-a-pool-for-a-token-launch/create-dlmm-launch-pool

1. https://ilm.jup.ag/ ILM 曲线工具设计流动性分配曲线和其他参数。
2. 设置您的激活点（代币发行时间）
3. 使用项目代币进行单边流动性引导，无需初始的 USDC 或 SOL 资本
4. 代币在启动时可立即在 Jupiter（Swap、DCA、LO）及所有 Jupiter 集成中交易以及流行的交易机器人
5. 集中流动性，零滑点区间和动态费用（启动池的平均费用为 6-7%）



DLMM SDK on github: https://github.com/MeteoraAg/dlmm-sdk

DLMM API endpoints: https://dlmm-api.meteora.ag/swagger-ui/#/

Devnet: https://devnet.meteora.ag/



binArray 程序账户 租金不可退还



Smart contract risk 智能合约风险
Risk of a stablecoin depeg稳定币脱钩的风险
