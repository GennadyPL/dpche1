let Data = require('./class/Data')
let Browser = require('./class/Browser')
let User = require('./class/Data')

let DISP_LIST = new Data()
let DISP_LIST_ERR = new Data()

const COUNT_BROWSER = 4 //  количество потоков

async function main(){
    await DISP_LIST.install('./Data/DISP_LIST.xml')
    await DISP_LIST_ERR.install('./Data/DISP_LIST_ERR.xml')
    
    let botNet=[]

    for (let i=0;i<COUNT_BROWSER;i++){
        botNet.push(new Browser(i,DISP_LIST,DISP_LIST_ERR))
    }
    console.log('run install')
    await Promise.all(botNet.map(item=>item.install()))
    console.log('end install')

    console.log('run authorization')
    await Promise.all(botNet.map(item=>item.authorization()))
    console.log('end authorization')
    
    console.log('run runInputData')
    await Promise.all(botNet.map(item=>item.runInputData()))
    console.log('end runInputData')

    
}

main()
console.log('end')