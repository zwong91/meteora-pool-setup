import {
	Cluster,
	Connection,
	Keypair,
	PublicKey,
	sendAndConfirmTransaction
} from "@solana/web3.js"
import {
	MeteoraConfig,
	getAmountInLamports,
	getQuoteDecimals,
	runSimulateTransaction,
	modifyComputeUnitPriceIx,
	getDammV2ActivationType
} from "../"
import { Wallet, BN } from "@coral-xyz/anchor"
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import {
	BaseFee,
	CpAmm,
	getPriceFromSqrtPrice,
	getSqrtPriceFromPrice,
	MAX_SQRT_PRICE,
	MIN_SQRT_PRICE,
	PoolFeesParams
} from "@meteora-ag/cp-amm-sdk"

export async function createDammV2CustomizablePool(
	config: MeteoraConfig,
	connection: Connection,
	wallet: Wallet,
	baseTokenMint: PublicKey,
	quoteTokenMint: PublicKey,
	opts?: {
		cluster?: Cluster
		programId?: PublicKey
	}
) {
	if (!config.dynamicAmmV2) {
		throw new Error("Missing dynamic amm v2 configuration")
	}
	console.log("\n> Initializing customize Dynamic AMM V2 pool...")

	const quoteDecimals = await getQuoteDecimals(
		connection,
		config.quoteSymbol,
		config.quoteMint
	)

	let baseTokenInfo = null
	let baseTokenProgram = TOKEN_PROGRAM_ID

	const baseMintAccountInfo = await connection.getAccountInfo(
		new PublicKey(baseTokenMint)
	)

	const baseMint = await getMint(
		connection,
		baseTokenMint,
		connection.commitment,
		baseMintAccountInfo.owner
	)

	if (baseMintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
		const epochInfo = await connection.getEpochInfo()
		baseTokenInfo = {
			mint: baseMint,
			currentEpoch: epochInfo.epoch
		}
		baseTokenProgram = TOKEN_2022_PROGRAM_ID
	}

	const baseDecimals = baseMint.decimals

	// create cp amm instance
	const cpAmmInstance = new CpAmm(connection)
	// setup pool params
	const minSqrtPrice = config.dynamicAmmV2.minSqrtPrice
		? new BN(config.dynamicAmmV2.minSqrtPrice)
		: MIN_SQRT_PRICE
	const maxSqrtPrice = config.dynamicAmmV2.maxSqrtPrice
		? new BN(config.dynamicAmmV2.maxSqrtPrice)
		: MAX_SQRT_PRICE

	if (minSqrtPrice.gte(maxSqrtPrice)) {
		throw new Error("Invalid price range")
	}

	let liquidityDelta: BN
	let initPriceInQ64: BN
	let tokenAAmount: BN
	let tokenBAmount: BN
	if (config.dynamicAmmV2.createPoolSingleSide) {
		if (config.dynamicAmmV2.baseAmount) {
			tokenAAmount = getAmountInLamports(
				config.dynamicAmmV2.baseAmount,
				baseDecimals
			)
			tokenBAmount = new BN(0)
			liquidityDelta = cpAmmInstance.preparePoolCreationSingleSide({
				tokenAAmount,
				minSqrtPrice,
				maxSqrtPrice,
				initSqrtPrice: minSqrtPrice, // single side deposit base only
				tokenAInfo: baseTokenInfo
			})
		} else {
			throw new Error("Invalid create pool single side, must provide base Amount")
		}
	} else if (config.dynamicAmmV2.initPrice) {
		initPriceInQ64 = getSqrtPriceFromPrice(
			config.dynamicAmmV2.initPrice,
			baseDecimals,
			quoteDecimals
		)
		if (config.dynamicAmmV2.baseAmount) {
			tokenAAmount = getAmountInLamports(
				config.dynamicAmmV2.baseAmount,
				baseDecimals
			)

			const { liquidityDelta: liquidity, outputAmount } =
				await cpAmmInstance.getDepositQuote({
					inAmount: tokenAAmount,
					isTokenA: true,
					minSqrtPrice,
					maxSqrtPrice,
					sqrtPrice: initPriceInQ64,
					inputTokenInfo: baseTokenInfo,
					outputTokenInfo: null
				})
			liquidityDelta = liquidity
			tokenBAmount = outputAmount
		} else if (config.dynamicAmmV2.quoteAmount) {
			tokenBAmount = getAmountInLamports(
				config.dynamicAmmV2.quoteAmount,
				quoteDecimals
			)

			const { liquidityDelta: liquidity, outputAmount } =
				await cpAmmInstance.getDepositQuote({
					inAmount: tokenBAmount,
					isTokenA: false,
					minSqrtPrice,
					maxSqrtPrice,
					sqrtPrice: initPriceInQ64,
					inputTokenInfo: null,
					outputTokenInfo: tokenAAmount
				})
			liquidityDelta = liquidity
			tokenAAmount = outputAmount
		} else {
			throw new Error("Must provide either baseAmount or quoteAmount with initPrice")
		}
	} else if (config.dynamicAmmV2.baseAmount && config.dynamicAmmV2.quoteAmount) {
		tokenAAmount = getAmountInLamports(config.dynamicAmmV2.baseAmount, baseDecimals)
		tokenBAmount = getAmountInLamports(
			config.dynamicAmmV2.quoteAmount,
			quoteDecimals
		)

		const { initSqrtPrice, liquidityDelta: liquidity } =
			cpAmmInstance.preparePoolCreationParams({
				tokenAAmount,
				tokenBAmount,
				minSqrtPrice,
				maxSqrtPrice,
				tokenADecimal: baseDecimals,
				tokenBDecimal: quoteDecimals,
				tokenAInfo: baseTokenInfo,
				tokenBInfo: null
			})
		initPriceInQ64 = initSqrtPrice
		liquidityDelta = liquidity
	} else {
		throw new Error(
			"Must provide: 1) baseAmount for single-side, 2) initPrice with either token, or 3) both tokens"
		)
	}

	console.log(`- Using token A amount ${config.dynamicAmmV2.baseAmount}`)
	console.log(`- Using token B amount ${config.dynamicAmmV2.quoteAmount ?? 0}`)
	console.log(
		`- Init price ${getPriceFromSqrtPrice(initPriceInQ64, baseDecimals, quoteDecimals)}`
	)

	const activationType = getDammV2ActivationType(config.dynamicAmmV2.activationType)
	const dynamicFeeConfig = {
		binStep: 1,
		binStepU128: new BN("1844674407370955"),
		filterPeriod: 10,
		decayPeriod: 120,
		reductionFactor: 5000,
		variableFeeControl: 2000000,
		maxVolatilityAccumulator: 100000
	}
	const baseFee: BaseFee = {
		cliffFeeNumerator: new BN(config.dynamicAmmV2.cliffFeeNumerator),
		numberOfPeriod: config.dynamicAmmV2.numberOfPeriod,
		periodFrequency: new BN(config.dynamicAmmV2.periodFrequency),
		reductionFactor: new BN(config.dynamicAmmV2.reductionFactor),
		feeSchedulerMode: config.dynamicAmmV2.feeSchedulerMode
	}

	const poolFees: PoolFeesParams = {
		baseFee,
		protocolFeePercent: 20,
		partnerFeePercent: 0,
		referralFeePercent: 20,
		dynamicFee: config.dynamicAmmV2.hasDynamicFee ? dynamicFeeConfig : null
	}
	const positionNft = Keypair.generate()

	const {
		tx: initCustomizePoolTx,
		pool,
		position
	} = await cpAmmInstance.createCustomPool({
		payer: wallet.publicKey,
		creator: new PublicKey(config.dynamicAmmV2.creator),
		positionNft: positionNft.publicKey,
		tokenAMint: baseTokenMint,
		tokenBMint: quoteTokenMint,
		tokenAAmount: tokenAAmount,
		tokenBAmount: tokenBAmount,
		sqrtMinPrice: config.dynamicAmmV2.minSqrtPrice
			? new BN(config.dynamicAmmV2.minSqrtPrice)
			: MIN_SQRT_PRICE,
		sqrtMaxPrice: config.dynamicAmmV2.maxSqrtPrice
			? new BN(config.dynamicAmmV2.maxSqrtPrice)
			: MAX_SQRT_PRICE,
		liquidityDelta: liquidityDelta,
		initSqrtPrice: initPriceInQ64,
		poolFees: poolFees,
		hasAlphaVault: config.dynamicAmmV2.hasAlphaVault,
		activationType: activationType,
		collectFeeMode: config.dynamicAmmV2.collectFeeMode,
		activationPoint: config.dynamicAmmV2.activationPoint
			? new BN(config.dynamicAmmV2.activationPoint)
			: null,
		tokenAProgram: baseTokenProgram,
		tokenBProgram: TOKEN_PROGRAM_ID
	})

	modifyComputeUnitPriceIx(initCustomizePoolTx, config.computeUnitPriceMicroLamports)

	console.log(`\n> Pool address: ${pool}`)
	console.log(`\n> Position address: ${position}`)

	if (config.dryRun) {
		console.log(`> Simulating init pool tx...`)
		await runSimulateTransaction(
			connection,
			[wallet.payer, positionNft],
			wallet.publicKey,
			[initCustomizePoolTx]
		)
	} else {
		console.log(`>> Sending init pool transaction...`)
		const initPoolTxHash = await sendAndConfirmTransaction(
			connection,
			initCustomizePoolTx,
			[wallet.payer, positionNft]
		).catch((err) => {
			console.error(err)
			throw err
		})
		console.log(`>>> Pool initialized successfully with tx hash: ${initPoolTxHash}`)
	}
}
