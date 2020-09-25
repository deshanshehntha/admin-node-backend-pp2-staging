class UserStore {


    constructor() {
        this._data = [];
    }

    add(socketId, id, url, timestamp, cluster) {
        let obj = {
            socketId : socketId,
            id : id,
            url : url,
            timestamp : timestamp,
            cluster : cluster
        }
        this._data.push(obj);
    }

    find(url) {
        console.log(url)
        let result =[]
        result = this._data.filter(function (a) {
                return a.url === url;
        });

        return result.length === 1;

    }


    getAll() {
        // return this._data.find(d => d.id === id);
        return this._data;
    }

    remove(socketId) {
        this._data = this._data.filter(function (obj) {
            return obj.socketId !== socketId;

        });
        console.log("deleted" + this._data)

    }
}

const instance = new UserStore();

module.exports = instance;
