import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import fs from "fs"
import { DLMM_PROGRAM_IDS } from "../libs/constants"
import { createPermissionlessDlmmPool } from "../index"
import { Wallet, web3 } from "@coral-xyz/anchor"
import {
	ActivationTypeConfig,
	MeteoraConfig,
	PriceRoundingConfig
} from "../libs/config"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo
} from "@solana/spl-token"

const keypairFilePath =
	"./src/tests/keys/localnet/admin-bossj3JvwiNK7pvjr149DqdtJxf2gdygbcmEPTkb2F1.json"
const keypairBuffer = fs.readFileSync(keypairFilePath, "utf-8")
const rpcUrl = "http://127.0.0.1:8899"
const connection = new Connection("http://127.0.0.1:8899", "confirmed")
const payerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairBuffer)))
const payerWallet = new Wallet(payerKeypair)
const DLMM_PROGRAM_ID = new PublicKey(DLMM_PROGRAM_IDS["localhost"])

describe("Test Create Dlmm Pool with token2022", () => {
	const WEN_DECIMALS = 5
	const USDC_DECIMALS = 6
	const JUP_DECIMALS = 6
	const WEN_SUPPLY = 100_000_000
	const USDC_SUPPLY = 100_000_000
	const JUP_SUPPLY = 7_000_000_000

	let WEN: PublicKey
	let USDC: PublicKey
	let JUP: PublicKey
	let userWEN: web3.PublicKey
	let userUSDC: web3.PublicKey
	let userJUP: web3.PublicKey

	beforeAll(async () => {
		WEN = await createMint(
			connection,
			payerKeypair,
			payerKeypair.publicKey,
			null,
			WEN_DECIMALS,
			Keypair.generate(),
			undefined,
			TOKEN_2022_PROGRAM_ID
		)

		USDC = await createMint(
			connection,
			payerKeypair,
			payerKeypair.publicKey,
			null,
			USDC_DECIMALS,
			Keypair.generate(),
			undefined,
			TOKEN_2022_PROGRAM_ID
		)

		JUP = await createMint(
			connection,
			payerKeypair,
			payerKeypair.publicKey,
			null,
			JUP_DECIMALS,
			Keypair.generate(),
			undefined,
			TOKEN_2022_PROGRAM_ID
		)

		const userWenInfo = await getOrCreateAssociatedTokenAccount(
			connection,
			payerKeypair,
			WEN,
			payerKeypair.publicKey,
			false,
			"confirmed",
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)
		userWEN = userWenInfo.address

		const userUsdcInfo = await getOrCreateAssociatedTokenAccount(
			connection,
			payerKeypair,
			USDC,
			payerKeypair.publicKey,
			false,
			"confirmed",
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)
		userUSDC = userUsdcInfo.address

		const userJupInfo = await getOrCreateAssociatedTokenAccount(
			connection,
			payerKeypair,
			JUP,
			payerKeypair.publicKey,
			false,
			"confirmed",
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)
		userJUP = userJupInfo.address

		await mintTo(
			connection,
			payerKeypair,
			WEN,
			userWEN,
			payerKeypair.publicKey,
			WEN_SUPPLY * 10 ** WEN_DECIMALS,
			[],
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID
		)

		await mintTo(
			connection,
			payerKeypair,
			USDC,
			userUSDC,
			payerKeypair.publicKey,
			USDC_SUPPLY * 10 ** USDC_DECIMALS,
			[],
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID
		)

		await mintTo(
			connection,
			payerKeypair,
			JUP,
			userJUP,
			payerKeypair.publicKey,
			JUP_SUPPLY * 10 ** JUP_DECIMALS,
			[],
			{
				commitment: "confirmed"
			},
			TOKEN_2022_PROGRAM_ID
		)
	})

	it("Should be able to create Basic DLMM pool", async () => {
		const config: MeteoraConfig = {
			dryRun: false,
			rpcUrl,
			keypairFilePath,
			computeUnitPriceMicroLamports: 100000,
			createBaseToken: null,
			baseMint: WEN.toString(),
			quoteSymbol: "USDC",
			dlmm: {
				binStep: 200,
				feeBps: 200,
				initialPrice: 0.5,
				activationType: ActivationTypeConfig.Timestamp,
				activationPoint: null,
				priceRounding: PriceRoundingConfig.Up,
				hasAlphaVault: false,
				creatorPoolOnOffControl: false
			},
			dynamicAmm: null,
			alphaVault: null,
			lockLiquidity: null,
			lfgSeedLiquidity: null,
			singleBinSeedLiquidity: null,
			m3m3: null,
			setDlmmPoolStatus: null
		}
		await createPermissionlessDlmmPool(config, connection, payerWallet, WEN, USDC, {
			cluster: "localhost",
			programId: DLMM_PROGRAM_ID
		})
	})

	it("Should be able to create DLMM pool without strict quote token", async () => {
		const config: MeteoraConfig = {
			dryRun: false,
			rpcUrl,
			keypairFilePath,
			computeUnitPriceMicroLamports: 100000,
			createBaseToken: null,
			baseMint: WEN.toString(),
			quoteMint: JUP.toString(),
			dlmm: {
				binStep: 200,
				feeBps: 200,
				initialPrice: 0.5,
				activationType: ActivationTypeConfig.Timestamp,
				activationPoint: null,
				priceRounding: PriceRoundingConfig.Up,
				hasAlphaVault: false,
				creatorPoolOnOffControl: false
			},
			dynamicAmm: null,
			alphaVault: null,
			lockLiquidity: null,
			lfgSeedLiquidity: null,
			singleBinSeedLiquidity: null,
			m3m3: null,
			setDlmmPoolStatus: null
		}
		await createPermissionlessDlmmPool(config, connection, payerWallet, WEN, JUP, {
			cluster: "localhost",
			programId: DLMM_PROGRAM_ID
		})
	})
})
