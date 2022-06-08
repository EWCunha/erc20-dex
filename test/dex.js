const { expectRevert } = require('@openzeppelin/test-helpers')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
const Dai = artifacts.require('mocks/Dai.sol')
const Bat = artifacts.require('mocks/Bat.sol')
const Rep = artifacts.require('mocks/Rep.sol')
const Zrx = artifacts.require('mocks/Zrx.sol')
const Dex = artifacts.require('Dex.sol')

const SIDE = { BUY: 0, SELL: 1 }

contract('Dex', (accounts) => {
    let dai, bat, rep, zrx, dex
    const [trader1, trader2] = [accounts[1], accounts[2]]
    const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX']
        .map(ticker => web3.utils.fromAscii(ticker))

    beforeEach(async () => {
        // [dai, bat, rep, zrx] = await Promise.all([
        //     Dai.new(),
        //     Bat.new(),
        //     Rep.new(),
        //     Zrx.new()
        // ])
        dai = await Dai.new()
        bat = await Bat.new()
        rep = await Rep.new()
        zrx = await Zrx.new()

        dex = await Dex.new();
        // await Promise.all([
        //     dex.addToken(DAI, dai.address),
        //     dex.addToken(BAT, bat.address),
        //     dex.addToken(REP, rep.address),
        //     dex.addToken(ZRX, zrx.address)
        // ])

        await dex.addToken(DAI, dai.address)
        await dex.addToken(BAT, bat.address)
        await dex.addToken(REP, rep.address)
        await dex.addToken(ZRX, zrx.address)

        const amount = web3.utils.toWei('1000');
        const seedTokenBalance = async (token, trader) => {
            await token.faucet(trader, amount)
            await token.approve(
                dex.address,
                amount,
                { from: trader }
            )
        }

        await seedTokenBalance(dai, trader1)
        await seedTokenBalance(bat, trader1)
        await seedTokenBalance(rep, trader1)
        await seedTokenBalance(zrx, trader1)

        await seedTokenBalance(dai, trader2)
        await seedTokenBalance(bat, trader2)
        await seedTokenBalance(rep, trader2)
        await seedTokenBalance(zrx, trader2)

        // await Promise.all(
        //     [dai, bat, rep, zrx].map(
        //         token => seedTokenBalance(token, trader1)
        //     )
        // )
        // await Promise.all(
        //     [dai, bat, rep, zrx].map(
        //         token => seedTokenBalance(token, trader2)
        //     )
        // )
    })

    // deposit()
    it('should deposit tokens', async () => {
        const amount = web3.utils.toWei('100')

        await dex.deposit(
            amount,
            DAI,
            { from: trader1 }
        )

        const balance = await dex.traderBalances(trader1, DAI)
        assert(balance.toString() === amount)
    })

    it('should NOT deposit tokens if token does not exist', async () => {
        await expectRevert(
            dex.deposit(
                web3.utils.toWei('100'),
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),
                { from: trader1 }
            ), "this token does not exist"
        )
    })

    // withdraw()
    it("should withdraw tokens", async () => {
        const amount = web3.utils.toWei("100")
        await dex.deposit(amount, DAI, { from: trader1 })
        await dex.withdraw(amount, DAI, { from: trader1 })

        const balanceDex = await dex.traderBalances(trader1, DAI)
        const balanceDai = await dai.balanceOf(trader1)

        assert(balanceDex.isZero())
        assert(balanceDai.toString() === web3.utils.toWei("1000"))
    })

    it("should NOT withdraw tokens if token does not exist", async () => {
        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('100'),
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),
                { from: trader1 }
            ), "this token does not exist"
        )
    })

    it("should NOT withdraw tokens if balance is too low", async () => {
        const amount = web3.utils.toWei("100")
        await dex.deposit(amount, DAI, { from: trader1 })

        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('1000'),
                DAI,
                { from: trader1 }
            ), "balance too low"
        )
    })

    // createLimitOrder()
    it("should create limit order", async () => {
        const amount = web3.utils.toWei("100")
        await dex.deposit(amount, DAI, { from: trader1 })

        await dex.createLimitOrder(REP, web3.utils.toWei("10"), 10, SIDE.BUY, { from: trader1 })
        let buyOrders = await dex.getOrders(REP, SIDE.BUY)
        let sellOrders = await dex.getOrders(REP, SIDE.SELL)

        assert(buyOrders.length === 1)
        assert(buyOrders[0].trader === trader1)
        assert(buyOrders[0].ticker === web3.utils.padRight(REP, 64))
        assert(buyOrders[0].price === "10")
        assert(buyOrders[0].amount === web3.utils.toWei("10"))
        assert(sellOrders.length === 0)

        await dex.deposit(web3.utils.toWei("200"), DAI, { from: trader2 })

        await dex.createLimitOrder(REP, web3.utils.toWei("10"), 11, SIDE.BUY, { from: trader2 })
        buyOrders = await dex.getOrders(REP, SIDE.BUY)
        sellOrders = await dex.getOrders(REP, SIDE.SELL)
        assert(buyOrders.length === 2)
        assert(buyOrders[0].trader === trader2)
        assert(buyOrders[1].trader === trader1)
        assert(sellOrders.length === 0)

        await dex.deposit(web3.utils.toWei("200"), DAI, { from: trader2 })

        await dex.createLimitOrder(REP, web3.utils.toWei("10"), 9, SIDE.BUY, { from: trader2 })
        buyOrders = await dex.getOrders(REP, SIDE.BUY)
        sellOrders = await dex.getOrders(REP, SIDE.SELL)
        assert(buyOrders.length === 3)
        assert(buyOrders[0].trader === trader2)
        assert(buyOrders[1].trader === trader1)
        assert(buyOrders[2].trader === trader2)
        assert(buyOrders[2].price === "9")
        assert(sellOrders.length === 0)
    })

    it("should NOT create limit order if token does not exist", async () => {
        await expectRevert(
            dex.createLimitOrder(
                web3.utils.fromAscii("TOKEN-DOES-NOT-EXIST"),
                web3.utils.toWei("10"),
                10,
                SIDE.BUY,
                { from: trader1 }
            ), "this token does not exist"
        )
    })

    it("should NOT create limit order if token is DAI", async () => {
        await expectRevert(
            dex.createLimitOrder(
                DAI,
                web3.utils.toWei("10"),
                10,
                SIDE.BUY,
                { from: trader1 }
            ), "cannot trade DAI"
        )
    })

    it("should NOT create limit order if token balance is too low", async () => {
        await dex.deposit(web3.utils.toWei("99"), REP, { from: trader1 })

        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei("100"),
                10,
                SIDE.SELL,
                { from: trader1 }
            ), "token balance too low"
        )
    })

    it("should NOT create limit order if DAI balance is too low", async () => {
        await dex.deposit(web3.utils.toWei("99"), DAI, { from: trader1 })

        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei("10"),
                10,
                SIDE.BUY,
                { from: trader1 }
            ), "dai balance too low"
        )
    })

    // createMarketOrder()
    it("should create market order and match against existing limit order", async () => {
        await dex.deposit(web3.utils.toWei("100"), DAI, { from: trader1 })
        await dex.createLimitOrder(
            REP,
            web3.utils.toWei("10"),
            10,
            SIDE.BUY,
            { from: trader1 }
        )

        await dex.deposit(web3.utils.toWei("100"), REP, { from: trader2 })
        await dex.createMarketOrder(REP, web3.utils.toWei("5"), SIDE.SELL, { from: trader2 })

        const balances = []
        balances[0] = await dex.traderBalances(trader1, DAI)
        balances[1] = await dex.traderBalances(trader1, REP)
        balances[2] = await dex.traderBalances(trader2, DAI)
        balances[3] = await dex.traderBalances(trader2, REP)
        const orders = await dex.getOrders(REP, SIDE.BUY)

        assert(orders[0].filled === web3.utils.toWei("5"))
        assert(balances[0].toString() === web3.utils.toWei("50"))
        assert(balances[1].toString() === web3.utils.toWei("5"))
        assert(balances[2].toString() === web3.utils.toWei("50"))
        assert(balances[3].toString() === web3.utils.toWei("95"))
    })

    it("should NOT create market order if token does not exist", async () => {
        await expectRevert(
            dex.createMarketOrder(
                web3.utils.fromAscii("TOKEN-DOES-NOT-EXIST"),
                web3.utils.toWei("10"),
                SIDE.BUY,
                { from: trader1 }
            ), "this token does not exist"
        )
    })

    it("should NOT create market order if token is DAI", async () => {
        await expectRevert(
            dex.createMarketOrder(
                DAI,
                web3.utils.toWei("10"),
                SIDE.BUY,
                { from: trader1 }
            ), "cannot trade DAI"
        )
    })

    it("should NOT create market order if token balance is too low", async () => {
        await dex.deposit(web3.utils.toWei("99"), REP, { from: trader1 })

        await expectRevert(
            dex.createMarketOrder(
                REP,
                web3.utils.toWei("100"),
                SIDE.SELL,
                { from: trader1 }
            ), "token balance too low"
        )
    })

    it("should NOT create market order if DAI balance is too low", async () => {
        await dex.deposit(web3.utils.toWei("100"), REP, { from: trader1 })
        await dex.createLimitOrder(
            REP,
            web3.utils.toWei("100"),
            10,
            SIDE.SELL,
            { from: trader1 }
        )

        await expectRevert(
            dex.createMarketOrder(
                REP,
                web3.utils.toWei("100"),
                SIDE.BUY,
                { from: trader2 }
            ), "dai balance too low"
        )
    })
})
