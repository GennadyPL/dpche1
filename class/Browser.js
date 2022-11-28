let fs = require('fs')
let xml2js = require('xml2js')

let webdriver = require('selenium-webdriver')
let chrome = require('selenium-webdriver/chrome');

class Browser{
    constructor(id,DISP_LIST,DISP_LIST_ERR){
        this.browser // 
        this.name='Browser:'+id
        this.path = './'+this.name

        this.pathLogGoo=this.path+'/log_goo.xml'
        this.pathLogErr=this.path+'/log_err.xml'

        this.logGoo;
        this.logErr;
        this.dataChild;

        this.DISP_LIST=DISP_LIST
        this.DISP_LIST_ERR=DISP_LIST_ERR
        this.builder = new xml2js.Builder()


        //____
        let folders = fs.readdirSync('./')

        if(!folders.includes(this.name)){
            fs.mkdirSync(this.path)
        }
        folders = fs.readdirSync(this.path)

        if(!folders.includes('log_goo.xml')){
            fs.writeFileSync(this.pathLogGoo,'<?xml version="1.0" encoding="utf-8"?> <children><child>0</child></children>')
        }
        if(!folders.includes('log_err.xml')){
            fs.writeFileSync(this.pathLogErr,'<?xml version="1.0" encoding="utf-8"?> <children><child>0</child></children>')
        }
       

        
        
        
    }
    async install(){
        let service = new chrome.ServiceBuilder('./chromedriver')
        this.browser = new webdriver.Builder().forBrowser('chrome').setChromeService(service).build()

        //___ log
        
        let xml = fs.readFileSync(this.path+'/log_err.xml');
        this.logErr =  await xml2js.parseStringPromise(xml)
        xml = fs.readFileSync(this.path+'/log_goo.xml');
        this.logGoo =  await xml2js.parseStringPromise(xml)

        await this.timeout(5000)
    } 
    async authorization(){
        await this.browser.get('https://orph.egisz.rosminzdrav.ru/')
        await this.click("//A[text()='Войти']")
        await this.inData("//INPUT[@id='login']",'+79922800580')
        await this.inData("//INPUT[@id='password']","gfkttd324Z!")
        await this.click("//BUTTON[text()=' Войти ']")
        await this.timeout(10000)
    }
    
    async runInputData(){
        while(true){
            try{
                if (! await this.installData()){
                    break
                }
                // Предварительные проверки
                
                if (Number(this.dataChild.cards[0].card[0].ageObsled[0]) <= 48 ){
                    this.logGoo.children.child.push(
                        this.logErr.children.child.pop()
                    )
                    await this.saveState()
                    continue
                }
    
                await this.scenePatientCard()
    
                //проверка на запоняется и на существования
                if(await this.isFlag(`//p[text()=' профилактический осмотр ']/../p[text()=' Выполнено ']/../p[text()=' ${this.dataChild.ageOnYearObsled} лет ']`)) {
                    this.logGoo.children.child.push(
                        this.logErr.children.child.pop()
                    )
                    await this.saveState()
                    continue
                }
                if(await this.isFlag("//p[text()=' Заполняется ']/../a")){
                            
                    // let url = await await this.browser.findElement(webdriver.By.xpath("//p[text()=' Заполняется ']/../a")).getAttribute('href')
                    // await this.browser.get(url)
                    // await this.isFlag("//p[text()='Общая информация']")
    
                    // await this.click("//button[text()=' Заблокировать ']")
                    continue
                }
    
                await this.sceneCreatCard()
                
                await this.sceneGeneral()
                
                await this.sceneGrade()
    
                await this.sceneHealth()

                await this.sceneResearch()
                
                await this.sceneConclusions()
                
                this.logGoo.children.child.push(
                    this.logErr.children.child.pop()
                )
                await this.saveState()
            }catch (err){
                //throw err
                console.log(err)
            }
            
            
        }
        return true
    }


    async scenePatientCard(){
        try{
            // while(await this.isFlag("//mat-spinner")){
            //     //timout
            // }
            await this.isFlag("//span[text()='ЕГИСЗ']")

            await this.browser.get('https://orph.egisz.rosminzdrav.ru/patient-card')
            
            if (this.dataChild.idSex[0] == '2'){
                await this.click("//SPAN[text()='Мужской']/../../..")
                await this.click("//span[text()='Женский']/..")
            }
            if ('snils' in this.dataChild && this.dataChild.snils[0]!=''){
                await this.inData("//mat-label[text()=' СНИЛС ']/../../../input",this.dataChild.snils[0])                        
            }else{
                await this.click("//input[@id='mat-checkbox-1-input']/../..")

                while(!await this.isFlag("//span[text()='Другое']/..")){
                    await this.click("//mat-label[text()='Причина отсутствия СНИЛС ']/../../../..")
                }
                        
                await this.click("//span[text()='Другое']/..")
                        
                await this.inData("//mat-label[text()=' Введите причину отсутствия СНИЛС ']/../../../input",'-')   
            }
            if(await this.isFlag('//a[@mattooltip="Пациенты с таким СНИЛС существуют"]')){
                await this.click('//a[@mattooltip="Пациенты с таким СНИЛС существуют"]/mat-icon')
                let url = await await this.browser.findElement(webdriver.By.xpath("//div[@class='dup_pat_data ng-star-inserted']/a")).getAttribute('href')
                
                await this.browser.get(url)
                return 
            }

            await this.inData("//mat-label[text()=' Имя ']/../../../input",this.dataChild['name'][0]['first'][0])
                    //Отчество
            await this.inData("//mat-label[text()=' Отчество ']/../../../input",this.dataChild['name'][0]['middle'][0])
                    //ДР                    
            await this.inData("//mat-label[text()=' Дата рождения ']/../../../input",this.dataChild['dateOfBirth'][0].split('-').reverse().join(''))
            //Фамилия если есть
            // if(this.dataChild['name'][0]['last'][0]){
            await this.inData("//mat-label[text()=' Фамилия ']/../../../input",this.dataChild['name'][0]['last'][0])
            // }
            if(await this.isFlag('//a[@mattooltip="Пациенты с таким ФИО существуют"]')){
                await this.click('//a[@mattooltip="Пациенты с таким ФИО существуют"]/mat-icon')
                let url = await await this.browser.findElement(webdriver.By.xpath("//div[@class='dup_pat_data ng-star-inserted']/a")).getAttribute('href')
                
                await this.browser.get(url)
                return 
            }
            console.log('oops')

            await this.click("//div[text()='Документы ']/../..//mat-icon")

            this.dataChild['documentSer'][0] = this.dataChild['documentSer'][0].split(' ').join('')

            if(['AS','AA','1АЛ','АА','FS','КР-Х','AC',''].includes(this.dataChild['documentSer'][0])){
                await this.click(" //span[text() = '21 - Паспорт гражданина РФ']/../../..")
                await this.click("//span[text()='91 - Иные документы']/..")
                
            }else if(!+this.dataChild['documentSer'][0]){
                await this.click(" //span[text() = '21 - Паспорт гражданина РФ']/../../..")
                await this.click("//span[text()='03 - Свидетельство о рождении']/..")                            
            }

            await this.inData("//mat-label[text()='Серия документа ']/../../../input",this.dataChild['documentSer'][0])

            while (await this.isFlag("//button[text()=' Добавить ' and @disabled='']")){
                    
                if(this.dataChild['documentNum'][0]=='' || this.dataChild['documentNum'][0].length<6){
                    await this.inData("//mat-label[text()='Номер документа ']/../../../input",Math.floor(Math.random()*1000000000000))
                }else{
                    await this.inData("//mat-label[text()='Номер документа ']/../../../input",this.dataChild['documentNum'][0]++)
                }
            }
            await this.click("//button[text()=' Добавить ']")
            await this.isFlag("//button[@ng-reflect-disabled='false']//span[text()=' Сохранить ']/..")
            await this. click("//span[text()=' Сохранить ']/..")

            return
        }catch (err){
            
            throw err
        }
        
    }


    async sceneCreatCard(){
        try{
            await this.click("//div[text()=' Карты осмотра ']/div/mat-icon[text()='add']")
            await this.inData("//div[text()='Создание карты осмотра']/..//div/div/input",this.dataChild['cards'][0]['card'][0]['dateOfObsled'][0].split('-').reverse().join(''))
            await this.click("//label[text()='Возрастная группа:']/..//div/div")
            await this.click(`//span[text()=' ${this.dataChild.ageOnYearObsled} лет ']/..`)
            await this.click("//button[text()='Создать']")
        
        }catch (err){
            throw err
        }
    }
       
    async sceneGeneral(){
        try{
            await this.isFlag("//p[text()='Общая информация']")
        
            await this.inData("//mat-label[text()='Место постоянного пребывания']/../../../input",'Череповец')
            await this.click("//mat-option[@title='Вологодская Область, г. Череповец']")
    
            await this.inData("//mat-label[text()='Страховая медицинская организация']/../../../input",'35003')
            await this.click("//span[text()='35003 - ВОЛОГОДСКИЙ ФИЛИАЛ АКЦИОНЕРНОГО ОБЩЕСТВА \"СТРАХОВАЯ КОМПАНИЯ \"СОГАЗ-МЕД\" - Вологодская область ']/..")
    
            if (this.dataChild['polisNum'][0].length == 9){
                await this.click("//mat-label[text()='Тип полиса']/../../../mat-select/div")
                await this.click("//span[text()=' Временное свидетельство ']/..")
                            
            }
    
            await this.inData("//span[text()='Номер полиса']/../../../input",this.dataChild['polisNum'][0])
    
                        //сохранять пока не сохранится 
            while(!await this.isFlag("//div[text()=' Сохранено ']")){
                await this.click("//button[text()=' Сохранить ']")   
            }
            await this.click("//button[text()=' OK ']")
    
            await this.click("//p[text()=' Оценка развития ']")
        }catch (err){
            throw err
        }
       

    }

    async sceneGrade(){
        try{
            await this.isFlag("//p[text()='Оценка физического развития']")

            await this.inData("//span[text()='Рост, см']/../../../input",this.dataChild['cards'][0]['card'][0]['height'][0])
            await this.inData("//span[text()='Вес, кг']/../../../input",this.dataChild['cards'][0]['card'][0]['weight'][0])
                    
            if(await this.isFlag("//span[text()='Окружность головы, см']/../../../input")){
                await this.inData("//span[text()='Окружность головы, см']/../../../input",'20')
            }
                        
            await this.click("//p[text()='Вес']/../div//mat-radio-button")
            await this.click("//p[text()='Рост']/../div//mat-radio-button")
                    
            if(await this.isFlag("//p[text()='Оценка психического развития для детей 0-4 лет']")){
                await this.inData("//span[text()='Познавательная функция (возраст развития)']/../../../input",'3')
                await this.inData("//span[text()='Моторная функция (возраст развития)']/../../../input",'3')
                await this.inData("//span[text()='Эмоциональная и социальная (контакт с окружающим миром) функции (возраст развития)']/../../../input",'3')
                await this.inData("//span[text()='Предречевое и речевое развитие (возраст развития)']/../../../input",'3')
            }

                   
            for (let item of ['p','ax','ma','me','fa']){
                if(await this.isFlag("//mat-select[@ng-reflect-name='"+item+"']/div")){
                    await this.click("//mat-select[@ng-reflect-name='"+item+"']/div")
                    await this.click("//span[text()=' 0 ']/..")
                }
            }

            if(await this.isFlag("//span[text()=' Отсутствует ']/..//input[@aria-checked='false']")){
                await this.click("//span[text()=' Отсутствует ']/../..")
            }
                    
                    
            while(! await this.isFlag("//div[text()=' Сохранено ']")){
                await this.click("//button[text()=' Сохранить ']")
            }
            await this.click("//button[text()=' OK ']")

            await this.click("//p[text()=' Состояние здоровья ']")
        }catch (err){
            throw err
        }
    }


    async sceneHealth(){
        try{
            await this.isFlag("//p[text()='До проведения настоящего профилактического осмотра']")
        
            await this.click("//mat-label[text()='Группа здоровья']/../../../..")
            let healthGroupBefore={
                '1':'//span[@class="mat-option-text"][text()=" I группа "]/..',
                '2':"//span[@class='mat-option-text'][text()=' II группа ']/..",
                '3':"//span[@class='mat-option-text'][text()=' III группа ']/..",
                '4':"//span[@class='mat-option-text'][text()=' IV группа ']/..",
                '5':"//span[@class='mat-option-text'][text()=' V группа ']/.."
            }
            
            await this.click(healthGroupBefore[this.dataChild['cards'][0]['card'][0]['healthGroupBefore'][0]])

        
            await this.click("//mat-label[text()='Медицинская группа для занятий физической культурой']/../../../mat-select/div")
            let fizkultGroupBefore={
                '1':'//span[@class="mat-option-text"][text()=" I группа "]/..',
                '2':"//span[@class='mat-option-text'][text()=' II группа ']/..",
                '3':"//span[@class='mat-option-text'][text()=' III группа ']/..",
                '4':"//span[@class='mat-option-text'][text()=' IV группа ']/..",
                '5':"//span[@class='mat-option-text'][text()=' V группа ']/.."
            }
            await this.click(fizkultGroupBefore[this.dataChild['cards'][0]['card'][0]['fizkultGroupBefore'][0]])

        //если есть диагноз до ... заносим ...
        if ('diagnosisBefore' in this.dataChild['cards'][0]['card'][0] && this.dataChild['cards'][0]['card'][0]['diagnosisBefore'][0] !='\r\n\t\t\t\t'){
            
            for(let item of this.dataChild['cards'][0]['card'][0]['diagnosisBefore'][0]['diagnosis']){
                await this.click("//p[text()='До проведения настоящего профилактического осмотра']/..//button[text()=' Добавить диагноз ']")
                
                await this.inData("//mat-label[text()='Диагноз']/../../../input",item['mkb'][0])
                await this.click("//mat-option")
                await this.click("//p[text()=' Добавить диагноз ']/../..//button[text()=' Сохранить ']")
                
                while (await this.isFlag("//p[text()='По результатам проведения настоящего профилактического осмотра']/..//div[@mattooltip='Нажмите для удаления диагноза']")){
                    await this.click("//p[text()='По результатам проведения настоящего профилактического осмотра']/..//div[@mattooltip='Нажмите для удаления диагноза']")
                    await this.click("//button[text()='Ок']")
                }
                    
            }

            

        }
        //если есть диагноз после ... заносим ...
        if ('diagnosisAfter' in this.dataChild['cards'][0]['card'][0] && this.dataChild['cards'][0]['card'][0]['diagnosisAfter'][0]!='\r\n\t\t\t\t'){
            
            for ( let item of this.dataChild['cards'][0]['card'][0]['diagnosisAfter'][0]['diagnosis'] ){
                await this.click("//p[text()='По результатам проведения настоящего профилактического осмотра']/..//button[text()=' Добавить диагноз ']")
                await this.inData("//mat-label[text()='Диагноз']/../../../input",item['mkb'][0])
                await this.click("//mat-option")

                let dispNablud ={
                    '0':"//div[text()=' не установлено ']/../..",
                    '1':"//div[text()=' установлено ранее ']/../..",
                    '2':"//div[text()=' установлено впервые ']/../.."
                }

                await this.click(dispNablud[item['dispNablud'][0]])

                await this.inData("//p[text()=' Рекомендации ']/../textarea",item['recommendNext'][0])
                await this.click("//p[text()='Добавить диагноз']/../..//button[text()=' Сохранить ']")    
            }
        }

        while(! await this.isFlag("//div[text()=' Сохранено ']")){

            await this.click("//button[text()=' Сохранить ']")
            
        }
        await this.click("//button[text()=' OK ']")

        await this.click("//p[text()=' Исследования ']")
        }catch(err){
            throw err
        }
        
    }


    async sceneResearch(){
        try{
            for(let item of ['Скрининг на выявление группы риска возникновения или наличия нарушений психического развития','Общий анализ крови','Общий анализ мочи','Электрокардиография','Ультразвуковое исследование органов брюшной полости (комплексное)','Ультразвуковое исследование почек','Эхокардиография']){
                        
            
                if(await this.isFlag("//p[text()='"+item+"']/../..//mat-label[text()=' Введите дату ']/../../../input")){
                    await this.inData("//p[text()='"+item+"']/../..//mat-label[text()=' Введите дату ']/../../../input",this.dataChild['cards'][0]['card'][0]['dateOfObsled'][0].split('-').reverse().join(''))
                    await this.inData("//p[text()='"+item+"']/../..//span[text()='Результат']/../../..//textarea",'Норма')
    
                }
            }
    
            while(! await this.isFlag("//div[text()=' Сохранено ']")){
    
                await this.click("//button[text()=' Сохранить ']")
                
            }
            await this.click("//button[text()=' OK ']")
    
            await this.click("//p[text()=' Заключение ']")
        }catch (err){
            throw err
        }
        
        
    }

    async sceneConclusions(){
        try{
            await this.click("//mat-label[text()='Группа здоровья']/../../../..")
            
            let healthGroup={
                '1':"//span[@class='mat-option-text'][text()=' I группа ']/..",
                '2':"//span[@class='mat-option-text'][text()=' II группа ']/..",
                '3':"//span[@class='mat-option-text'][text()=' III группа ']/..",
                '4':"//span[@class='mat-option-text'][text()=' IV группа ']/..",
                '5':"//span[@class='mat-option-text'][text()=' V группа ']/.."
            }
            
            await this.click(healthGroup[this.dataChild['cards'][0]['card'][0]['healthGroup'][0]])

            await this.click("//mat-label[text()='Группа для занятий физической культурой']/../../../..")
            
            let fizkultGroupBefore={
                '1':"//span[@class='mat-option-text'][text()=' I ']/..",
                '2':"//span[@class='mat-option-text'][text()=' II ']/..",
                '3':"//span[@class='mat-option-text'][text()=' III ']/..",
                '4':"//span[@class='mat-option-text'][text()=' IV ']/..",
                '-1':"//span[text()=' не допущен ']/.."
            }
                    
            await this.click(fizkultGroupBefore[this.dataChild['cards'][0]['card'][0]['healthGroup'][0]])

                    //Проверка врача 
            if(['ЗАГРЕКОВА','УНДИЛАШВИЛИ','ВУКОЛОВА'].includes( this.dataChild['cards'][0]['card'][0]['zakluchVrachName'][0]['last'][0])){
                this.dataChild['cards'][0]['card'][0]['zakluchVrachName'][0]['last'][0] ='Васильева'
            }
                       
            await this.inData("//mat-label[text()='Лицо, давшее заключение']/../../../input", this.dataChild['cards'][0]['card'][0]['zakluchVrachName'][0]['last'][0])
            await this.click("//mat-option")

            for (let item of ['ПЕДИАТР','НЕВРОЛОГ','ОФТАЛЬМОЛОГ','ОТОРИНОЛАРИНГОЛОГ','СТОМАТОЛОГ ДЕТСКИЙ','ТРАВМАТОЛОГ-ОРТОПЕД','ПСИХИАТР ПОДРОСТКОВЫЙ','ЭНДОКРИНОЛОГ ДЕТСКИЙ (С 5 ЛЕТ)','АКУШЕР-ГИНЕКОЛОГ','ДЕТСКИЙ ХИРУРГ','ДЕТСКИЙ УРОЛОГ-АНДРОЛОГ (С 5 ЛЕТ)','ПСИХИАТР ДЕТСКИЙ']){
                if(await this.isFlag("//p[text()='"+item+"']/../../bs-date-picker//input")){
                    await this.inData("//p[text()='"+item+"']/../../bs-date-picker//input",this.dataChild['cards'][0]['card'][0]['zakluchDate'][0].split('-').reverse().join(''))
                }
            }

            await this.inData("//mat-label[text()='Рекомендации']/../../../input",'По возрасту')


            while(! await this.isFlag("//div[text()=' Сохранено ']")){
                await this.click("//button[text()=' Сохранить ']")
            }
            await this.click("//button[text()=' OK ']")



            await this.click("//button[text()=' Выполнено ']")
            await this.click("//button[text()='Да']")
                   
                    

        }catch(err){
            throw err
        }

    }










    async installData(){
        let dataCount = this.DISP_LIST.getCount()? true 
                        : this.DISP_LIST_ERR.getCount()? true
                            : null
        if(!dataCount){
            return false
        }                    
        
        this.dataChild  = this.DISP_LIST.getCount() ?
            await this.DISP_LIST.getChild() :
            await this.DISP_LIST_ERR.getChild()
        
        this.logErr.children.child.push(this.dataChild)

        await this.saveState()
        
        return true 
    }

    async saveState(){  
       
        fs.writeFileSync(this.pathLogGoo,this.builder .buildObject(this.logGoo).toString())
        fs.writeFileSync(this.pathLogErr,this.builder .buildObject(this.logErr).toString())

    }
    async inData(xpath,data){
        if(await this.isFlag(xpath)){
            await this.browser.findElement(webdriver.By.xpath(xpath)).clear()
            await this.browser.findElement(webdriver.By.xpath(xpath)).sendKeys(data)
        }else{
            throw 'Not '+xpath
        }
    }
    async click(xpath){
        if(await this.isFlag(xpath)){
            await this.browser.findElement(webdriver.By.xpath(xpath)).click()
        }else{
            throw 'Not '+xpath
        }
    }
    async isFlag(xpath){

        let sleep = 500
        await this.timeout(sleep)
        
        let i=5
        while (i) {
            try{
                    return await this.browser.findElement(webdriver.By.xpath(xpath))
            }
            catch(err){

            }
            
            
            await this.timeout(sleep)
            i--
        }
        return false

    }
    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    
}
module.exports = Browser