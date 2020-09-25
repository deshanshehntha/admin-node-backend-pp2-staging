
var ElectionContract = require("../model/ElectionContract");
const HalfNodeConnectionStore = require("../../Util/Datastores/halfnodeConnectionStore");
const ElectionResultDataStore = require("../../Util/Datastores/electionResultDataStore")


class SmartContractRunner {

    constructor() {
        SmartContractRunner._contracts = [];
    }

    async startSmartContract(electionCategory,
                             creator,
                             electionName,
                             voters,
                             candidates,
                             description,
                             startDate,
                             endDate) {

        const contract = new ElectionContract(electionCategory,
            creator,
            electionName,
            voters,
            candidates,
            description,
            startDate,
            endDate,
            "")

        const newChain = await contract.deploy();
        const name = await newChain.getChainFileName();
        contract.setBlockchainFileName(name);
        SmartContractRunner._contracts.push(contract);
        return contract.getContractId();
    }

    getSmartContract(contract_id) {
        const contract =  SmartContractRunner._contracts.find(contract => contract._contractId === contract_id);
        console.log(SmartContractRunner._contracts);
        return contract;
    }

    getAllContracts() {
        return SmartContractRunner._contracts;
    }

    addBlock(id, transaction) {
        const contract =  SmartContractRunner._contracts.find(contract => contract._contractId === id);
        console.log(contract);
    }

    async readResults(id) {
        const contract = SmartContractRunner._contracts.find(contract => contract._contractId === id);
        let f = await contract.readBlock();
        console.log(f);
        return f;
    }

    async addToRecordDataPool(data, id) {
        const contract = SmartContractRunner._contracts.find(contract => contract._contractId === id);
        console.log(data)
        console.log(id)
        await contract.createRecordInPool(data);
    }


    async mineBlocks(id) {
        const contract =  SmartContractRunner._contracts.find(contract => contract._contractId === id);
        contract.mineRecordPoolBlocks().then(r => {
            console.log("Blocks mined")
        })
    }

    async calculateResults(id) {
        const contract = SmartContractRunner._contracts.find(contract => contract._contractId === id);
        let f = await contract.readBlock();
        var obj= f.pop();

        const vote = obj.data;
        console.log("read result");
        let obsj = [];
        obsj = vote[0];
        if(obsj !== undefined) {
            console.log(obsj.data[0].data[0])
            ElectionResultDataStore.addResult(obsj.data[0].data[0],contract);
        }

        return f;
    }

}

const instance = new SmartContractRunner();

module.exports = instance;

