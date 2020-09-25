var Candidate = require("../model/Candidate");
var SmartContractInterface = require("../core/SmartContractInterface");
const HalfNodeConnectionStore = require("../../Util/Datastores/halfnodeConnectionStore");


class ElectionContract extends SmartContractInterface{



    constructor(electionCategory,
                creator,
                electionName,
                voters,
                candidates,
                description,
                startDate,
                endDate,
                clusterLeaderNode) {
        super(creator);
        this._electionCategory = electionCategory;
        this._voters = voters;
        this._candidates = candidates;
        this._electionName = electionName;
        this._description = description;
        this._startDate = startDate;
        this._endDate = endDate;
        this._clusterLeaderNode = this.mainClusterNodeSelectionAlgorithm();
        this._blockChainFileName = ""
    }

    addCandidate(name) {
        const candidate = new Candidate(name)
        this._candidates.push(candidate);
    }

    addPermissionToVoters(voter) {
        if(this._voters.includes(voter)) {
            voter._weight = 1;
        } else {
            voter._weight = 0;
        }
    }

    async createRecordInPool(data) {
       await this._chain.createRecord(data);
    }

    async mineRecordPoolBlocks() {
        await this._chain.mineRecords();

    }

    getContractId() {
        return this._contractId;
    }

    mainClusterNodeSelectionAlgorithm() {

        var byDate = HalfNodeConnectionStore.getAll().slice(0);
        byDate.sort(function(a,b) {
            return a.timestamp - b.timestamp;
        });
        byDate[0].timestamp = Date.now();
        console.log(byDate[0].url);
        return byDate[0].url;
    }

    setBlockchainFileName(name) {
        this._blockChainFileName = name;
    }

}
module.exports = ElectionContract;
