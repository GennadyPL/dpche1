const { Console } = require('console');
let fs = require('fs')
let xml2js = require('xml2js')
class Data{
    constructor(){
        this.data //
    }
    
    async install(path){
        this.path = path;
        let xml = fs.readFileSync(path);
        this.data =  await xml2js.parseStringPromise(xml)
        
        if(!Object.keys(this.data.children).includes('child')){
            this.data.children={child:[]}
            return
        }
        this.data.children.child = this.data.children.child.map(item=>{
            item.ageToday=getAge(item.dateOfBirth[0])
            
            let today = new Date();
            let year = today.getFullYear()

            item.ageOnYearObsled = year - Number(item.dateOfBirth[0].split('-')[0])
            return item
        })

        function getAge(dateOfBirth,dateOfObsled) {
            let today;
            if(dateOfObsled){
                today = new Date(dateOfObsled);
            }else{
                today = new Date();
            }
            
            let birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            let m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }
    }
    getCount(){
        return this.data.children.child.length
    }
    async getChild(){
        console.log(this.data.children.child.length)
        let data = this.data.children.child.shift()
        let builder = new xml2js.Builder()
        fs.writeFileSync(this.path,builder.buildObject(this.data).toString())
        return data
    }
}
module.exports = Data