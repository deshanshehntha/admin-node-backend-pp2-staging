const SmartContractRunner = require("../../SmartContract/runner/SmartContractRunner")

class ElectionResultDataStore {


    constructor() {
        this._data = [];
    }

    addResult(currentVote, contract){
        let yes = 0;
        let no = 0;

        const record = this._data.find(obj => obj.contractId === currentVote.conId);

        if(record === undefined || record === null) {
            const vote = this.yesNoMapper(currentVote);

            if(vote) {
                yes++;
            } else {
                no++;
            }
            const obj = {
                "contractId" : currentVote.conId,
                "electionName" : contract._electionName,
                "description" : contract._description,
                "results" : {
                    "yes": yes,
                    "no" : no
                }
            }
            this._data.push(obj);
        } else {

                let objIndex =  this._data.findIndex((obj => obj.contractId === currentVote.conId));
                const vote = this.yesNoMapper(currentVote);
                let currentVoteCounterObj = this._data[objIndex].results;

                if(vote) {
                    currentVoteCounterObj.yes = currentVoteCounterObj.yes + 1;
                } else {
                    currentVoteCounterObj.no = currentVoteCounterObj.no + 1;
                }
                this._data[objIndex].results = currentVoteCounterObj
        }



    }

    yesNoMapper(obj) {
        if(obj.vote === "Yes") {
            return true;
        } else if(obj.vote === "No") {
            return false;
        }
    }

    getResults() {
        return this._data;
    }


}

const instance = new ElectionResultDataStore();

module.exports = instance;
