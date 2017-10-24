module.exports = {
    write : function(message){
        return new Promise((resolve, reject)=>{
            var fs = require('fs');
            fs.writeFile("run.log", message+ "\n", { flag: 'a+' }, function (err) {
                if (err) throw err;
                resolve(true);
            });
        })
    }
}
