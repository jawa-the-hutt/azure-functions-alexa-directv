import fetch from 'node-fetch';
import GetEnvironmentVariable from "../../utils/get-environment-variable";
import GetBoolean from "../../utils/get-boolean";
import { asyncIt } from '../../utils/async-it';
import * as alexa from 'alexa-skill-sdk-for-azure-function';

let path = '';
let clientAddress = '';

//  determine if we want to use SSL to connect or not.
let protocol = GetBoolean(GetEnvironmentVariable('USE_SSL')) ? 'https' : 'http';

// setup the base URL used to connect to the network hosting the directv STB
const baseUrl = protocol + '://' + GetEnvironmentVariable('HOSTNAME') + ':' + GetEnvironmentVariable('PORT');

// setup array of arrays to hold info for conversion into objects later.
let roomArray = new Array();
let deviceArray = new Array();

// get info from function settings and create the array of arrays
for(let i=1; i <= GetEnvironmentVariable('NUMBER_OF_ROOMS'); i++){
    roomArray.push([GetEnvironmentVariable('ROOM_' + i + '_NAME'), GetEnvironmentVariable('ROOM_' + i + '_DTV_ADDRESS')]);
    deviceArray.push([GetEnvironmentVariable('ROOM_' + i + '_NAME'), GetEnvironmentVariable('ROOM_' + i + '_DEVICE_ID')]);
};

// map the rooms to a MAC address of the STB
const rooms = Object.assign(...roomArray.map( ([k, v]) => ({[k]: v}) ));

// map the alexa devices you have to their Amazon deviceID
const devices = Object.assign(...deviceArray.map( ([k, v]) => ({[k]: v}) ));

export default class CustomSlot {
    constructor(context, req) {
        this.context = context;
        this.req = req;
        this.alexa = alexa;
        
        // setup the connection to the alexa-skill-sdk-for-azure-function library
        this.alexa.setup({
            azureCtx: context,
            azureReq: req,
            handlers: [
                skillHandlers
            ],
            trackInvokedIntents: false,
            enforceVerifier: false,
            alexaAppId: GetEnvironmentVariable('ALEXA_APP_ID')
        });
    }

    async start() {
        try{
            // make the connection async/await capable
            return await asyncIt(cb => this.alexa.execute(cb)).then(result => {
                this.context.log('result - ', result);
                return {
                    status: 200,
                    body: result
                };
            });
        } catch (e){
            return e;
        }
    };
}

const skillHandlers = {
    'DirectvIntent': function () {
        // get the device ID of the Alexa device that is calling the service
        let deviceId = this.event.context.System.device.deviceId
        this.context.log('deviceId = ', deviceId);  // will help you find out what the device ID is so you can add it into the global devices object

        // get the mapping to the intent object
        let intent = this.event.request.intent;
        this.context.log('intent - ', intent);

        // get the authority that is returning from alexa service.  filter it based on your alexa app ID and the Control_List name you gave it
        let authority = intent.slots.Control.resolutions.resolutionsPerAuthority.filter(auth => auth.authority.includes(GetEnvironmentVariable('ALEXA_APP_ID') + ".Control_List"));

        // get the actual word being sent back from alexa service so that we can match it later
        let control = authority[0].values[0].value.id;
        this.context.log('control - ', control);

        // Setup default Alexa response.  This response will change
        // based on the match made in the switch statement that determines
        // which Control we are trying to use.
        let alexaResponse = 'ok';

        // did we detect a Control value?  If not, then Alexa will respond
        // with a message that she doesn't understand what you're trying to do.
        // If there is a value, then it will attempt to map it into an action
        if (control) {
            // Obtain User Intent
            switch(control) {
                    
                // based on the intent, this will map the action that simulates a button push on a remote control
                case "PLAY":
                    path = '/remote/processKey?key=play&hold=keyPress';
                    alexaResponse = "sure...playing now";
                break;
            
                case "PAUSE":
                    path = '/remote/processKey?key=pause&hold=keyPress';
                    alexaResponse = "sure...pausing now";
                break;
                
                case "GUIDE":
                    path = '/remote/processKey?key=guide&hold=keyPress';
                    alexaResponse = "sure...showing the guide";
                break;
                
                case "POWER":
                    path = '/remote/processKey?key=power&hold=keyPress';
                    alexaResponse = "hmm...this command isn't working currently";
                break;

                case "POWER-ON":
                    path = '/remote/processKey?key=poweron&hold=keyPress';
                    alexaResponse = "hmm...this command isn't working currently";
                break;

                case "POWER-OFF":
                    path = '/remote/processKey?key=poweroff&hold=keyPress';
                    alexaResponse = "hmm...this command isn't working currently";
                break;
                
                case "FORMAT":
                    path = '/remote/processKey?key=format&hold=keyPress';
                    alexaResponse = "hmm...this command isn't working currently";
                break;

                case "REWIND":
                    path = '/remote/processKey?key=rew&hold=keyPress';
                    alexaResponse = "sure...rewinding now";
                break;
                
                case "REPLAY":
                    path = '/remote/processKey?key=replay&hold=keyPress';
                    alexaResponse = "sure...jumping back a bit here";
                break;
                
                case "STOP":
                    path= '/remote/processKey?key=stop&hold=keyPress';
                    alexaResponse = "sure...stopping now";
                break;
                
                case "ADVANCE":
                    path= '/remote/processKey?key=advance&hold=keyPress';
                    alexaResponse = "sure...jumping forward a bit here";
                break;
                
                case "FAST-FORWARD":
                    path = '/remote/processKey?key=ffwd&hold=keyPress';
                    alexaResponse = "sure...fast forwarding now";
                break;
        
                case "RECORD":
                    path = '/remote/processKey?key=record&hold=keyPress';
                    alexaResponse = "sure...recording now";
                break;
                
                case "ACTIVE":
                    path= '/remote/processKey?key=active&hold=keyPress';
                    alexaResponse = "hmm...this command isn't working currently";
                break;
                
                case "DVR":
                    path = '/remote/processKey?key=list&hold=keyPress';
                    alexaResponse = "sure...showing the recorded shows";
                break;
                
                case "EXIT":
                    path = '/remote/processKey?key=exit&hold=keyPress';
                    alexaResponse = "sure...exiting now";
                break;
                             
                case "RED":
                    path= '/remote/processKey?key=red&hold=keyPress';
                    alexaResponse = "sure...pushing the big red button now";
                break;
                
                case "GREEN":
                    path= '/remote/processKey?key=green&hold=keyPress';
                    alexaResponse = "sure...pushing the green button";
                break;
                
                case "YELLOW":
                    path= '/remote/processKey?key=yellow&hold=keyPress';
                    alexaResponse = "sure...pushing the yellow button";
                break;
                
                case "BLUE":
                    path= '/remote/processKey?key=blue&hold=keyPress';
                    alexaResponse = "sure...pushing the blue button";
                break;
                
                case "BACK":
                    path= '/remote/processKey?key=back&hold=keyPress';
                    alexaResponse = "sure...going back now";
                break;

                case "MENU":
                    path = '/remote/processKey?key=menu&hold=keyPress';
                    alexaResponse = "sure...showing the menu now";
                break;
                
                case "INFO":
                    path= '/remote/processKey?key=info&hold=keyPress';
                    alexaResponse = "sure...here's the info you wanted";
                break;
                
                case "UP":
                    path = '/remote/processKey?key=up&hold=keyPress';
                    alexaResponse = "sure...going up";
                break;
                
                case "DOWN":
                    path = '/remote/processKey?key=down&hold=keyPress';
                    alexaResponse = "sure...going down";
                break;

                case "LEFT":
                    path= '/remote/processKey?key=left&hold=keyPress';
                    alexaResponse = "sure...going left";
                break;
            
                case "RIGHT":
                    path= '/remote/processKey?key=right&hold=keyPress';
                    alexaResponse = "sure...going right";
                break;
                
                case "SELECT":
                    path=  '/remote/processKey?key=select&hold=keyPress';
                    alexaResponse = "sure...selecing that now";
                break;
                
                case "CHANNEL-UP":
                    path= '/remote/processKey?key=chanup&hold=keyPress';
                    alexaResponse = "sure...going up a channel";
                break;
                
                case "CHANNEL-DOWN":
                    path = '/remote/processKey?key=chandown&hold=keyPress';
                    alexaResponse = "sure...going down a channel";
                break;
                
                case "PREVIOUS":
                    path= '/remote/processKey?key=prev&hold=keyPress';
                    alexaResponse = "sure...going back to the previous channel";
                break;
          
                // very, very, very long list of the channel mappings.  First section you can change and add
                // channels that are local to your DirecTV subscription
                case "NBC-LOCAL":
                    path = '/tv/tune?major=003';
                    alexaResponse = "sure...here is your local NBC station";
                break;
                case "FOX-LOCAL":
                    path = '/tv/tune?major=005';
                    alexaResponse = "sure...here is your local fox station";
                break;
                case "CBS-LOCAL":
                    path = '/tv/tune?major=010';
                    alexaResponse = "sure...here is your local CBS station";
                break;
                case "CW-LOCAL":
                    path = '/tv/tune?major=015';
                    alexaResponse = "sure...here is your local CW station";
                break;
                case "PBS-LOCAL":
                    path = '/tv/tune?major=021';
                    alexaResponse = "sure...here is your local PBS station";
                break;
                case "MY-TV":
                    path = '/tv/tune?major=027';
                    alexaResponse = "sure...here is your local my TV station";
                break;
                case "ABC-LOCAL":
                    path = '/tv/tune?major=033';
                    alexaResponse = "sure...here is your local ABC station";
                break;

                case "CNN":
                    path = '/tv/tune?major=202';
                    alexaResponse = "sure...changing to CNN";
                break;
                case "HLN":
                    path = '/tv/tune?major=204';
                    alexaResponse = "sure...changing to headline news";
                break;

                case "ESPN":
                    path = '/tv/tune?major=206';
                    alexaResponse = "sure...changing to ESPN";
                break;
                case "ESPN-NEWS":
                    path = '/tv/tune?major=207';
                    alexaResponse = "sure...changing to ESPN news";
                break;
                case "ESPNU":
                    path = '/tv/tune?major=208';
                    alexaResponse = "sure...changing to ESPN you";
                break;
                case "ESPN2":
                    path = '/tv/tune?major=209';
                    alexaResponse = "sure...changing to ESPN2";
                break;

                case "NFL":
                    path = '/tv/tune?major=212';
                    alexaResponse = "sure...changing to the NFL network";
                break;
                case "MLB":
                    path = '/tv/tune?major=213';
                    alexaResponse = "sure...changing to the MLB network";
                break;
                 case "MAVTV":
                    path = '/tv/tune?major=214';
                    alexaResponse = "sure...changing to MAVTV";
                break;
                case "NHL":
                    path = '/tv/tune?major=215';
                    alexaResponse = "sure...changing to the NHL network";
                break;
                case "NHL-ALT":
                    path = '/tv/tune?major=215-1';
                    alexaResponse = "sure...changing to the NHL network alternate";
                break;
                case "NBA":
                    path = '/tv/tune?major=216';
                    alexaResponse = "sure...changing to MBA network";
                break;

                case "TENNIS":
                    path = '/tv/tune?major=217';
                    alexaResponse = "sure...changing to the tennis channel";
                break;
                case "GOLF":
                    path = '/tv/tune?major=218';
                    alexaResponse = "sure...changing to the golf channel";
                break;

                case "FS1":
                    path = '/tv/tune?major=219';
                    alexaResponse = "sure...changing to FS1";
                break;
                case "NBC-SPORTS":
                    path = '/tv/tune?major=220';
                    alexaResponse = "sure...changing to the NBC sports network";
                break;
                case "NBC-SPORTS-ALT":
                    path = '/tv/tune?major=220-1';
                    alexaResponse = "sure...changing to the NBC sports network alternate";
                break; 
                case "CBS-SPORTS":
                    path = '/tv/tune?major=221';
                    alexaResponse = "sure...changing to the CBS sports network";
                break;

                case "HGTV":
                    path = '/tv/tune?major=229';
                    alexaResponse = "sure...changing to HGTV";
                break;

                case "DIY":
                    path = '/tv/tune?major=230';
                    alexaResponse = "sure...changing to DIY";
                break;

                case "FOOD":
                    path = '/tv/tune?major=231';
                    alexaResponse = "sure...changing to food network";
                break;

                case "COOKING":
                    path = '/tv/tune?major=232';
                    alexaResponse = "sure...changing to cooking channel";
                break;

                case "GSN":
                    path = '/tv/tune?major=233';
                    alexaResponse = "sure...changing to the game show network";
                break;

                case "E!":
                    path = '/tv/tune?major=236';
                    alexaResponse = "sure...changing to e";
                break;

                case "BRAVO":
                    path = '/tv/tune?major=237';
                    alexaResponse = "sure...changing to bravo";
                break;

                case "REELZ":
                    path = '/tv/tune?major=238';
                    alexaResponse = "sure...changing to reels";
                break;

                case "PARAMOUNT":
                    path = '/tv/tune?major=241';
                    alexaResponse = "sure...changing to paramount network";
                break;

                case "USA":
                    path = '/tv/tune?major=242';
                    alexaResponse = "sure...changing to USA";
                break;

                case "SYFY":
                    path = '/tv/tune?major=244';
                    alexaResponse = "sure...changing to the sci fi channel";
                break;

                case "TNT":
                    path = '/tv/tune?major=245';
                    alexaResponse = "sure...changing to TNT";
                break;

                case "TRUTV":
                    path = '/tv/tune?major=246';
                    alexaResponse = "sure...changing to true TV";
                break;

                case "TBS":
                    path = '/tv/tune?major=247';
                    alexaResponse = "sure...changing to TBS";
                break;

                case "FX":
                    path = '/tv/tune?major=248';
                    alexaResponse = "sure...changing to FX";
                break;

                case "COMEDY-CENTRAL":
                    path = '/tv/tune?major=249';
                    alexaResponse = "sure...changing to comedy central";
                break;

                case "OXYGEN":
                    path = '/tv/tune?major=251';
                    alexaResponse = "sure...changing to oxygen";
                break;

                case "LIFETIME":
                    path = '/tv/tune?major=252';
                    alexaResponse = "sure...changing to lifetime";
                break;

                case "LMN":
                    path = '/tv/tune?major=253';
                    alexaResponse = "sure...changing to lifetime moving network";
                break;

                case "AMC":
                    path = '/tv/tune?major=254';
                    alexaResponse = "sure...changing to AMC";
                break;

                case "TCM":
                    path = '/tv/tune?major=256';
                    alexaResponse = "sure...changing to turner classic movies";
                break;

                case "FXM":
                    path = '/tv/tune?major=258';
                    alexaResponse = "sure...changing to fox movie channel";
                break;

                case "FXX":
                    path = '/tv/tune?major=259';
                    alexaResponse = "sure...changing to FXX";
                break;

                case "WE-TV":
                    path = '/tv/tune?major=260';
                    alexaResponse = "sure...changing to we TV";
                break;

                case "DISCOVERY-LIFE":
                    path = '/tv/tune?major=261';
                    alexaResponse = "sure...changing to discovery life";
                break;

                case "BBC-AMERICA":
                    path = '/tv/tune?major=264';
                    alexaResponse = "sure...changing to BBC america";
                break;

                case "A&E":
                    path = '/tv/tune?major=265';
                    alexaResponse = "sure...changing to A&E";
                break;

                case "FYI":
                    path = '/tv/tune?major=266';
                    alexaResponse = "sure...changing to FYI";
                break;

                case "HISTORY":
                    path = '/tv/tune?major=269';
                    alexaResponse = "sure...changing to the history channel";
                break;

                case "VICELAND":
                    path = '/tv/tune?major=271';
                    alexaResponse = "sure...changing to viceland";
                break;

                case "LOGO":
                    path = '/tv/tune?major=272';
                    alexaResponse = "sure...changing to logo TV";
                break;

                case "POP":
                    path = '/tv/tune?major=273';
                    alexaResponse = "sure...changing to pop";
                break;

                case "OVATION":
                    path = '/tv/tune?major=274';
                    alexaResponse = "sure...changing to ovation";
                break;

                case "NAT-GEO":
                    path = '/tv/tune?major=276';
                    alexaResponse = "sure...changing to nat geo";
                break;

                case "TRAVEL":
                    path = '/tv/tune?major=277';
                    alexaResponse = "sure...changing to the travel channel";
                break;

                case "DISCOVERY":
                    path = '/tv/tune?major=278';
                    alexaResponse = "sure...changing to the discovery channel";
                break;

                case "OWN":
                    path = '/tv/tune?major=279';
                    alexaResponse = "sure...changing to oprah winfrey network";
                break;

                case "TLC":
                    path = '/tv/tune?major=280';
                    alexaResponse = "sure...changing to the learning channel";
                break;

                case "VELOCITY":
                    path = '/tv/tune?major=281';
                    alexaResponse = "sure...changing to velocity";
                break;

                case "ANIMAL-PLANET":
                    path = '/tv/tune?major=282';
                    alexaResponse = "sure...changing to animal planet";
                break;

                case "NAT-GEO-WILD":
                    path = '/tv/tune?major=283';
                    alexaResponse = "sure...changing to nat geo wild";
                break;

                case "SCIENCE":
                    path = '/tv/tune?major=284';
                    alexaResponse = "sure...changing to the science channel";
                break;

                case "INVESTIGATION-DISOVERY":
                    path = '/tv/tune?major=285';
                    alexaResponse = "sure...changing to investigation discovery";
                break;

                case "DESTINATION-AMERICA":
                    path = '/tv/tune?major=286';
                    alexaResponse = "sure...changing to destination america";
                break;

                case "AMERICAN-HEROES-CHANNEL":
                    path = '/tv/tune?major=287';
                    alexaResponse = "sure...changing to american heroes channel";
                break;

                case "DISNEY-JUNIOR":
                    path = '/tv/tune?major=289';
                    alexaResponse = "sure...changing to disney junior";
                break;

                case "DISNEY":
                    path = '/tv/tune?major=290';
                    alexaResponse = "sure...changing to the disney channel";
                break;

                case "DISNEY-WEST":
                    path = '/tv/tune?major=291';
                    alexaResponse = "sure...changing to the disney channel west";
                break;

                case "DISNEY-XD":
                    path = '/tv/tune?major=292';
                    alexaResponse = "sure...changing to disney XD";
                break;

                case "BABYFIRST":
                    path = '/tv/tune?major=293';
                    alexaResponse = "sure...changing to baby first";
                break;

                case "DISCOVERY-FAMILY":
                    path = '/tv/tune?major=294';
                    alexaResponse = "sure...changing to discovery family";
                break;

                case "UNIVERSAL-KIDS":
                    path = '/tv/tune?major=295';
                    alexaResponse = "sure...changing to univeral kids";
                break;

                case "CARTOON-NETWORK":
                    path = '/tv/tune?major=296';
                    alexaResponse = "sure...changing to the cartoon network";
                break;

                case "CARTOON-NETWORK-WEST":
                    path = '/tv/tune?major=297';
                    alexaResponse = "sure...changing to the cartoon network west";
                break;

                case "BOOMERANG":
                    path = '/tv/tune?major=298';
                    alexaResponse = "sure...changing to boomer rang";
                break;

                case "NICK":
                    path = '/tv/tune?major=299';
                    alexaResponse = "sure...changing to nickelodeon";
                break;

                case "NICK-WEST":
                    path = '/tv/tune?major=300';
                    alexaResponse = "sure...changing to nickelodeon west";
                break;

                case "NICK-JUNIOR":
                    path = '/tv/tune?major=301';
                    alexaResponse = "sure...changing to nick junior";
                break;

                case "NICK-TOONS":
                    path = '/tv/tune?major=302';
                    alexaResponse = "sure...changing to nick toons";
                break;

                case "NICK-TEEN":
                    path = '/tv/tune?major=303';
                    alexaResponse = "sure...changing to teen nick";
                break;

                case "TV-LAND":
                    path = '/tv/tune?major=304';
                    alexaResponse = "sure...changing to TV land";
                break;

                case "ION":
                    path = '/tv/tune?major=305';
                    alexaResponse = "sure...changing to eye on";
                break;

                case "ION-WEST":
                    path = '/tv/tune?major=306';
                    alexaResponse = "sure...changing to eye on west";
                break;

                case "WGN":
                    path = '/tv/tune?major=307';
                    alexaResponse = "sure...changing to WGN";
                break;

                case "FREEFORM":
                    path = '/tv/tune?major=311';
                    alexaResponse = "sure...changing to free form";
                break;

                case "HALLMARK":
                    path = '/tv/tune?major=312';
                    alexaResponse = "sure...changing to hallmark";
                break;

                case "GAC":
                    path = '/tv/tune?major=326';
                    alexaResponse = "sure...changing to great american country";
                break;

                case "CMT":
                    path = '/tv/tune?major=327';
                    alexaResponse = "sure...changing to country music television";
                break;

                case "TV1":
                    path = '/tv/tune?major=328';
                    alexaResponse = "sure...changing to TV one";
                break;

                case "BET":
                    path = '/tv/tune?major=329';
                    alexaResponse = "sure...changing to BET";
                break;

                case "BET-HER":
                    path = '/tv/tune?major=330';
                    alexaResponse = "sure...changing to BET her";
                break;

                case "MTV":
                    path = '/tv/tune?major=331';
                    alexaResponse = "sure...changing to MTV";
                break;

                case "MTV2":
                    path = '/tv/tune?major=332';
                    alexaResponse = "sure...changing to MTV2";
                break;

                case "IFC":
                    path = '/tv/tune?major=333';
                    alexaResponse = "sure...changing to IFC";
                break;

                case "VH1":
                    path = '/tv/tune?major=335';
                    alexaResponse = "sure...changing to VH1";
                break;

                case "MTV-CLASSICS":
                    path = '/tv/tune?major=336';
                    alexaResponse = "sure...changing to MTV classics";
                break;

                case "UP-TV":
                    path = '/tv/tune?major=338';
                    alexaResponse = "sure...changing to up";
                break;

                case "FUSE":
                    path = '/tv/tune?major=339';
                    alexaResponse = "sure...changing to fuse";
                break;

                case "AXS":
                    path = '/tv/tune?major=340';
                    alexaResponse = "sure...changing to access TV";
                break;

                case "EL-REY":
                    path = '/tv/tune?major=341';
                    alexaResponse = "sure...changing to el rey";
                break;

                case "FUSION":
                    path = '/tv/tune?major=342';
                    alexaResponse = "sure...changing to fusion";
                break;

                case "RFD":
                    path = '/tv/tune?major=345';
                    alexaResponse = "sure...changing to RFDTV";
                break;

                case "BBC-WORLD-NEWS":
                    path = '/tv/tune?major=346';
                    alexaResponse = "sure...changing to BBC world news";
                break;

                case "CSPAN":
                    path = '/tv/tune?major=350';
                    alexaResponse = "sure...changing to CSPAN";
                break;

                case "CSPAN2":
                    path = '/tv/tune?major=351';
                    alexaResponse = "sure...changing to CSPAN2";
                break;

                case "NASA":
                    path = '/tv/tune?major=352';
                    alexaResponse = "sure...changing to the nasa channel";
                break;

                case "BLOOMBERG":
                    path = '/tv/tune?major=353';
                    alexaResponse = "sure...changing to bloomberg television";
                break;

                case "DOG-TV":
                    path = '/tv/tune?major=354';
                    alexaResponse = "sure...changing to dog TV";
                break;

                case "CNBC":
                    path = '/tv/tune?major=355';
                    alexaResponse = "sure...changing to CNBC";
                break;

                case "MSNBC":
                    path = '/tv/tune?major=356';
                    alexaResponse = "sure...changing to MSNBC";
                break;

                case "CNBC-WORLD":
                    path = '/tv/tune?major=357';
                    alexaResponse = "sure...changing to CNBC world";
                break;

                case "FOX-BUSINESS":
                    path = '/tv/tune?major=359';
                    alexaResponse = "sure...changing to fox business channel";
                break;

                case "FOX-NEWS":
                    path = '/tv/tune?major=360';
                    alexaResponse = "sure...changing to the fox news channel";
                break;

                case "WEATHERNATION":
                    path = '/tv/tune?major=361';
                    alexaResponse = "sure...changing to weather nation";
                break;

                case "WEATHER-CHANNEL":
                    path = '/tv/tune?major=362';
                    alexaResponse = "sure...changing to the weather channel";
                break;


                case "CBS":
                    path = '/tv/tune?major=390';
                    alexaResponse = "sure...changing to CBS east";
                break;

                case "CBS-WEST":
                    path = '/tv/tune?major=391';
                    alexaResponse = "sure...changing to CBS west";
                break;

                case "ABC":
                    path = '/tv/tune?major=202';
                    alexaResponse = "sure...changing to ABC east";
                break;

                case "ABC-WEST":
                    path = '/tv/tune?major=396';
                    alexaResponse = "sure...changing to ABC west";
                break;

                case "NBC":
                    path = '/tv/tune?major=397';
                    alexaResponse = "sure...changing to NBC east";
                break;

                case "NBC-WEST":
                    path = '/tv/tune?major=393';
                    alexaResponse = "sure...changing to NBC west";
                break;

                case "CW":
                    path = '/tv/tune?major=394';
                    alexaResponse = "sure...changing to the CW east";
                break;

                case "CW-WEST":
                    path = '/tv/tune?major=395';
                    alexaResponse = "sure...changing to the CW west";
                break;

                case "FOX":
                    path = '/tv/tune?major=398';
                    alexaResponse = "sure...changing to fox east";
                break;

                case "FOX-WEST":
                    path = '/tv/tune?major=399';
                    alexaResponse = "sure...changing to fox west";
                break;


                case "HBO":
                    path = '/tv/tune?major=501';
                    alexaResponse = "sure...changing to HBO";
                break;

                case "HBO-WEST":
                    path = '/tv/tune?major=504';
                    alexaResponse = "sure...changing to HBO west";
                break;

                case "HBO2":
                    path = '/tv/tune?major=502';
                    alexaResponse = "sure...changing to HBO2";
                break;

                case "HBO2-WEST":
                    path = '/tv/tune?major=505';
                    alexaResponse = "sure...changing to HBO2 west";
                break;

                case "HBO-SIGNATURE":
                    path = '/tv/tune?major=503';
                    alexaResponse = "sure...changing to HBO signature";
                break;

                case "HBO-COMEDY":
                    path = '/tv/tune?major=506';
                    alexaResponse = "sure...changing to HBO comedy";
                break;

                case "HBO-FAMILY":
                    path = '/tv/tune?major=507';
                    alexaResponse = "sure...changing to HBO family";
                break;

                case "HBO-FAMILY-WEST":
                    path = '/tv/tune?major=508';
                    alexaResponse = "sure...changing to HBO family west";
                break;

                case "HBO-ZONE":
                    path = '/tv/tune?major=509';
                    alexaResponse = "sure...changing to HBO zone";
                break;

                case "HBO-LATINO":
                    path = '/tv/tune?major=511';
                    alexaResponse = "sure...changing to HBO latino";
                break;


                case "CINEMAX":
                    path = '/tv/tune?major=515';
                    alexaResponse = "sure...changing to cinemax";
                break;
                case "CINEMAX-WEST":
                    path = '/tv/tune?major=516';
                    alexaResponse = "sure...changing to cinemax west";
                break;
                case "MORE-MAX":
                    path = '/tv/tune?major=517';
                    alexaResponse = "sure...changing to more max";
                break;
                case "ACTION-MAX":
                    path = '/tv/tune?major=519';
                    alexaResponse = "sure...changing to action max";
                break;
                case "5-STAR-MAX":
                    path = '/tv/tune?major=520';
                    alexaResponse = "sure...changing to 5 star max";
                break;
                case "MOVIE-MAX":
                    path = '/tv/tune?major=521';
                    alexaResponse = "sure...changing to movie max";
                break;
                case "THRILLER-MAX":
                    path = '/tv/tune?major=522';
                    alexaResponse = "sure...changing to thriller max";
                break;
                case "CINEMAX-SPANISH":
                    path = '/tv/tune?major=523';
                    alexaResponse = "sure...changing to cinemax spanish";
                break;


                case "STARZ":
                    path = '/tv/tune?major=525';
                    alexaResponse = "sure...changing to starz";
                break;

                case "STARZ-WEST":
                    path = '/tv/tune?major=526';
                    alexaResponse = "sure...changing to starz west";
                break;

                case "STARZ-FAMILY":
                    path = '/tv/tune?major=527';
                    alexaResponse = "sure...changing to starz kids and family";
                break;

                case "STARZ-COMEDY":
                    path = '/tv/tune?major=528';
                    alexaResponse = "sure...changing to starz comedy";
                break;

                case "STARZ-EDGE":
                    path = '/tv/tune?major=529';
                    alexaResponse = "sure...changing to starz edge";
                break;

                case "STARZ-BLACK":
                    path = '/tv/tune?major=530';
                    alexaResponse = "sure...changing to starz in black";
                break;

                case "STARZ-CINEMA":
                    path = '/tv/tune?major=529';
                    alexaResponse = "sure...changing to starz cinema";
                break;


                case "ENCORE":
                    path = '/tv/tune?major=535';
                    alexaResponse = "sure...changing to encore";
                break;

                case "ENCORE-WEST":
                    path = '/tv/tune?major=536';
                    alexaResponse = "sure...changing to encore west";
                break;

                case "ENCORE-CLASSIC":
                    path = '/tv/tune?major=537';
                    alexaResponse = "sure...changing to encore classic";
                break;

                case "ENCORE-WESTERNS":
                    path = '/tv/tune?major=538';
                    alexaResponse = "sure...changing to encore westerns";
                break;

                case "ENCORE-SUSPENSE":
                    path = '/tv/tune?major=539';
                    alexaResponse = "sure...changing to encore suspense";
                break;

                case "ENCORE-BLACK":
                    path = '/tv/tune?major=540';
                    alexaResponse = "sure...changing to encore black";
                break;

                case "ENCORE-ACTION":
                    path = '/tv/tune?major=541';
                    alexaResponse = "sure...changing to encore action";
                break;

                case "ENCORE-FAMILY":
                    path = '/tv/tune?major=542';
                    alexaResponse = "sure...changing to encore family";
                break;    
                
                
                case "SHOWTIME":
                    path = '/tv/tune?major=545';
                    alexaResponse = "sure...changing to showtime";
                break;

                case "SHOWTIME-WEST":
                    path = '/tv/tune?major=546';
                    alexaResponse = "sure...changing to showtime west";
                break;

                case "SHOWTIME2":
                    path = '/tv/tune?major=547';
                    alexaResponse = "sure...changing to showtime 2";
                break;

                case "SHOWTIME-SHOWCASE":
                    path = '/tv/tune?major=548';
                    alexaResponse = "sure...changing to showtime showcase";
                break;

                case "SHOWTIME-EXTREME":
                    path = '/tv/tune?major=549';
                    alexaResponse = "sure...changing to showtime extreme";
                break;

                case "SHOWTIME-BEYOND":
                    path = '/tv/tune?major=550';
                    alexaResponse = "sure...changing to showtime beyond";
                break;

                case "SHOWTIME-NEXT":
                    path = '/tv/tune?major=551';
                    alexaResponse = "sure...changing to showtime next";
                break;

                case "SHOWTIME-WOMEN":
                    path = '/tv/tune?major=552';
                    alexaResponse = "sure...changing to showtime women";
                break;


                case "THE-MOVIE-CHANNEL":
                    path = '/tv/tune?major=553';
                    alexaResponse = "sure...changing to TMC";
                break;

                case "THE-MOVIE-CHANNEL-WEST":
                    path = '/tv/tune?major=554';
                    alexaResponse = "sure...changing to TMC west";
                break;

                case "THE-MOVIE-CHANNEL-EXTRA":
                    path = '/tv/tune?major=555';
                    alexaResponse = "sure...changing to TMC extra";
                break;


                case "FLIX":
                    path = '/tv/tune?major=556';
                    alexaResponse = "sure...changing to flix";
                break;

                case "SUNDANCE":
                    path = '/tv/tune?major=557';
                    alexaResponse = "sure...changing to sundance TV";
                break;

                case "HALLMARK-MOVIES":
                    path = '/tv/tune?major=565';
                    alexaResponse = "sure...changing to the hallmark movies and mysteries channel";
                break;

                case "HDNET":
                    path = '/tv/tune?major=566';
                    alexaResponse = "sure...changing to HD net";
                break;

                case "MGM":
                    path = '/tv/tune?major=567';
                    alexaResponse = "sure...changing to MGM";
                break;

                case "SONY-MOVIES":
                    path = '/tv/tune?major=568';
                    alexaResponse = "sure...changing to the sony movies channel";
                break;


                case "SMITHSONIAN":
                    path = '/tv/tune?major=570';
                    alexaResponse = "sure...changing to the smithsonian channel";
                break;

                case "CRIME-INVESTIGATION":
                    path = '/tv/tune?major=571';
                    alexaResponse = "sure...changing to the crime and investigation network";
                break;

                case "MTV-LIVE":
                    path = '/tv/tune?major=572';
                    alexaResponse = "sure...changing to MTV live";
                break;

                case "SHORTS":
                    path = '/tv/tune?major=573';
                    alexaResponse = "sure...changing to shorts";
                break;


                case "TVG":
                    path = '/tv/tune?major=602';
                    alexaResponse = "sure...changing to the TVG network";
                break;

                case "COWBOY":
                    path = '/tv/tune?major=603';
                    alexaResponse = "sure...changing to the cowboy channel";
                break;

                case "PURSUIT":
                    path = '/tv/tune?major=604';
                    alexaResponse = "sure...changing to the pursuit channel";
                break;

                case "SPORTSMAN":
                    path = '/tv/tune?major=605';
                    alexaResponse = "sure...changing to the sportsman channel";
                break;

                case "OUTDOOR":
                    path = '/tv/tune?major=606';
                    alexaResponse = "sure...changing to the outdoor channel";
                break;


                case "FS-COLLEGE":
                    path = '/tv/tune?major=608';
                    alexaResponse = "sure...changing to fox college sports";
                break;

                case "B1G":
                    path = '/tv/tune?major=610';
                    alexaResponse = "sure...changing to the big ten network";
                break;

                case "SEC":
                    path = '/tv/tune?major=611';
                    alexaResponse = "sure...changing to the SEC network";
                break;

                case "ESPN-CLASSIC":
                    path = '/tv/tune?major=614';
                    alexaResponse = "sure...changing to ESPN classic";
                break;

                case "ESPN-GOAL-LINE":
                    path = '/tv/tune?major=615';
                    alexaResponse = "sure...changing to ESPN goal line";
                break;

                case "FS2":
                    path = '/tv/tune?major=618';
                    alexaResponse = "sure...changing to FS2";
                break;

                case "BEIN":
                    path = '/tv/tune?major=620';
                    alexaResponse = "sure...changing to be in sports";
                break;

                case "FOX-SOCCER-PLUS":
                    path = '/tv/tune?major=621';
                    alexaResponse = "sure...changing to fox soccer plus";
                break;

                case "ELEVEN-SPORTS":
                    path = '/tv/tune?major=623';
                    alexaResponse = "sure...changing to eleven sports network";
                break;

                case "OLYMPIC":
                    path = '/tv/tune?major=624';
                    alexaResponse = "sure...changing to olympic channel";
                break;

                case "NESN":
                    path = '/tv/tune?major=628';
                    alexaResponse = "sure...changing to NESN";
                break;

                case "NESN-PLUS":
                    path = '/tv/tune?major=628-1';
                    alexaResponse = "sure...changing to NESN plus";
                break;

                case "NBC-SPORTS-BOSTON":
                    path = '/tv/tune?major=630';
                    alexaResponse = "sure...changing to NBC sports boston";
                break;

                case "YES":
                    path = '/tv/tune?major=631';
                    alexaResponse = "sure...changing to the yes network";
                break;

                case "YES2":
                    path = '/tv/tune?major=631-1';
                    alexaResponse = "sure...changing to the yes network 2";
                break;

                case "MSG":
                    path = '/tv/tune?major=634';
                    alexaResponse = "sure...changing to MSG";
                break;

                case "MSG-PLUS":
                    path = '/tv/tune?major=635';
                    alexaResponse = "sure...changing to MSG plus";
                break;

                case "MSG-WESTERN-NY":
                    path = '/tv/tune?major=635-1';
                    alexaResponse = "sure...changing to MSG western new york";
                break;

                case "MSG-PLUS2":
                    path = '/tv/tune?major=635-2';
                    alexaResponse = "sure...changing to MSG plus 2";
                break;

                case "MSG2":
                    path = '/tv/tune?major=635-3';
                    alexaResponse = "sure...changing to MSG2";
                break;

                case "SNY":
                    path = '/tv/tune?major=639';
                    alexaResponse = "sure...changing to SNY";
                break;

                case "MASN":
                    path = '/tv/tune?major=640';
                    alexaResponse = "sure...changing to MASN";
                break;

                case "MASN2":
                    path = '/tv/tune?major=640-1';
                    alexaResponse = "sure...changing to MASN2";
                break;

                case "NBC-SPORTS-DC":
                    path = '/tv/tune?major=642';
                    alexaResponse = "sure...changing to NBC sports washington";
                break;

                case "NBC-SPORTS-DC-PLUS":
                    path = '/tv/tune?major=642-1';
                    alexaResponse = "sure...changing to NBC sports washington plus";
                break;

                case "FS-SOUTH":
                    path = '/tv/tune?major=646';
                    alexaResponse = "sure...changing to fox sports south";
                break;

                case "FS-CAROLINAS":
                    path = '/tv/tune?major=646-1';
                    alexaResponse = "sure...changing to fox sports carolinas";
                break;

                case "FS-TENNESSEE":
                    path = '/tv/tune?major=646-2';
                    alexaResponse = "sure...changing to fox sports tennessee";
                break;

                case "FS-SOUTHEAST":
                    path = '/tv/tune?major=649';
                    alexaResponse = "sure...changing to fox sports south east";
                break;

                case "FS-SOUTHEAST-ALT":
                    path = '/tv/tune?major=649-1';
                    alexaResponse = "sure...changing to fox sports south east alternate";
                break;

                case "FS-SOUTHEAST-ALT2":
                    path = '/tv/tune?major=649-2';
                    alexaResponse = "sure...changing to fox sports south east alternate 2";
                break;

                case "FS-SUN":
                    path = '/tv/tune?major=653';
                    alexaResponse = "sure...changing to fox sports sun";
                break;

                case "FS-SUN-ALT":
                    path = '/tv/tune?major=653-1';
                    alexaResponse = "sure...changing to fox sports sun alternate";
                break;

                case "FS-FLORIDA":
                    path = '/tv/tune?major=654';
                    alexaResponse = "sure...changing to fox sports florida";
                break;

                case "FS-FLORIDA-ALT":
                    path = '/tv/tune?major=654-1';
                    alexaResponse = "sure...changing to fox sports florida alternate";
                break;

                case "ATT-SPORTS-PITTSBURGH":
                    path = '/tv/tune?major=659';
                    alexaResponse = "sure...changing to AT&T sports net pittsburgh";
                break;

                case "FS-OHIO":
                    path = '/tv/tune?major=660';
                    alexaResponse = "sure...changing to fox sports ohio";
                break;

                case "FS-CINNCINNATI":
                    path = '/tv/tune?major=661';
                    alexaResponse = "sure...changing to fox sports cinncinnati";
                break;

                case "SPORTS-TIME-OHIO":
                    path = '/tv/tune?major=662';
                    alexaResponse = "sure...changing to sports time ohio";
                break;

                case "FS-DETROIT":
                    path = '/tv/tune?major=663';
                    alexaResponse = "sure...changing to fox sports detroit";
                break;

                case "FS-DETROIT-PLUS":
                    path = '/tv/tune?major=663-1';
                    alexaResponse = "sure...changing to fox sports detroit plus";
                break;

                case "NBC-SPORTS-CHICAGO":
                    path = '/tv/tune?major=665';
                    alexaResponse = "sure...changing to NBC sports chicago";
                break;

                case "NBC-SPORTS-CHICAGO-PLUS":
                    path = '/tv/tune?major=665-1';
                    alexaResponse = "sure...changing to NBC sports chicago plus";
                break;

                case "FS-NORTH":
                    path = '/tv/tune?major=668';
                    alexaResponse = "sure...changing to fox sports north";
                break;

                case "FS-WISCONSIN":
                    path = '/tv/tune?major=669';
                    alexaResponse = "sure...changing to fox sports wisconsin";
                break;

                case "FS-MW":
                    path = '/tv/tune?major=671';
                    alexaResponse = "sure...changing to fox sports midwest";
                break;

                case "FS-MW-ALT":
                    path = '/tv/tune?major=671-1';
                    alexaResponse = "sure...changing to fox sports midwest alternate";
                break;

                case "FS-MW-ALT2":
                    path = '/tv/tune?major=671-2';
                    alexaResponse = "sure...changing to fox sports midwest alternate 2";
                break;

                case "FS-MW-ALT3":
                    path = '/tv/tune?major=671-3';
                    alexaResponse = "sure...changing to fox sports midwest alternate 3";
                break;

                case "FS-INDIANA":
                    path = '/tv/tune?major=671-4';
                    alexaResponse = "sure...changing to fox sports indiana";
                break;

                case "FS-KC":
                    path = '/tv/tune?major=671-5';
                    alexaResponse = "sure...changing to fox sports kansas city";
                break;

                case "ATT-SPORTS-SW":
                    path = '/tv/tune?major=674';
                    alexaResponse = "sure...changing to AT&T sports net south west";
                break;

                case "ATT-SPORTS--SW-ALT":
                    path = '/tv/tune?major=674-1';
                    alexaResponse = "sure...changing to AT&T sports net south west alternate";
                break;

                case "FS-OK":
                    path = '/tv/tune?major=675';
                    alexaResponse = "sure...changing to fox sports oklahoma";
                break;

                case "FS-SW":
                    path = '/tv/tune?major=676';
                    alexaResponse = "sure...changing to fox sports southwest";
                break;

                case "FS-SW-PLUS":
                    path = '/tv/tune?major=676-1';
                    alexaResponse = "sure...changing to fox sports southwest plus";
                break;

                case "FS-SW-ALT":
                    path = '/tv/tune?major=676-2';
                    alexaResponse = "sure...changing to fox sports southwest alternate";
                break;

                case "FS-SW-ALT2":
                    path = '/tv/tune?major=676-3';
                    alexaResponse = "sure...changing to fox sports southwest alternate 2";
                break;

                case "FS-NOLA":
                    path = '/tv/tune?major=676-4';
                    alexaResponse = "sure...changing to fox sports new orleans";
                break;

                case "LONGHORN":
                    path = '/tv/tune?major=677';
                    alexaResponse = "sure...changing to longhorn network";
                break;

                case "ALTITUDE":
                    path = '/tv/tune?major=681';
                    alexaResponse = "sure...changing to altitude";
                break;

                case "ALTITUDE2":
                    path = '/tv/tune?major=681-1';
                    alexaResponse = "sure...changing to altitude 2";
                break;

                case "ATT-SPORTS-ROCKY-MOUNTAIN":
                    path = '/tv/tune?major=683';
                    alexaResponse = "sure...changing to AT&T sports rock mountain";
                break;

                case "ATT-SPORTS-UTAH":
                    path = '/tv/tune?major=683-1';
                    alexaResponse = "sure...changing to AT&T sports utah";
                break;

                case "ATT-SPORTS-ROCKY-MOUNTAIN-WEST":
                    path = '/tv/tune?major=684';
                    alexaResponse = "sure...changing to AT&T sports rocky mountain west";
                break;

                case "FS-AZ":
                    path = '/tv/tune?major=686';
                    alexaResponse = "sure...changing to fox sports arizona";
                break;

                case "FS-AZ-PLUS":
                    path = '/tv/tune?major=686-1';
                    alexaResponse = "sure...changing to fox sports arizona plus";
                break;

                case "ROOT-SPORTS-NW":
                    path = '/tv/tune?major=687';
                    alexaResponse = "sure...changing to root sports northwest";
                break;

                case "ROOT-SPORTS-NW-ALT":
                    path = '/tv/tune?major=687-1';
                    alexaResponse = "sure...changing to root sports northwest alternate";
                break;

                case "SPECTRUM-SPORTS":
                    path = '/tv/tune?major=691';
                    alexaResponse = "sure...changing to spectrum sports";
                break;

                case "FS-WEST":
                    path = '/tv/tune?major=692';
                    alexaResponse = "sure...changing to fox sports west";
                break;

                case "PRIME-TICKET":
                    path = '/tv/tune?major=693';
                    alexaResponse = "sure...changing to prime ticket";
                break;

                case "FS-SAN-DIEGO":
                    path = '/tv/tune?major=694';
                    alexaResponse = "sure...changing to fox sports san diego";
                break;

                case "NBC-SPORTS-BAY":
                    path = '/tv/tune?major=696';
                    alexaResponse = "sure...changing to NBC sports bay area";
                break;

                case "NBC-SPORTS-BAY-PLUS":
                    path = '/tv/tune?major=696-1';
                    alexaResponse = "sure...changing to NBC sports bay area plus";
                break;

                case "NBC-SPORTS-CALI":
                    path = '/tv/tune?major=698';
                    alexaResponse = "sure...changing to california";
                break;

                case "NBC-SPORTS-CALI-PLUS":
                    path = '/tv/tune?major=698-1';
                    alexaResponse = "sure...changing to california plus";
                break;

                case "MLB-STRIKE-ZONE":
                    path = '/tv/tune?major=719';
                    alexaResponse = "sure...changing to MLB strike zone";
                break;
                
                // default check to see if a number was passed in and if so, it tries 
                // to change the STB to that channel.  otherwise it gives up
                default:
                
                    if (! isNaN(intent.slots.Channel.value) ) {
                        path = '/tv/tune?major=' + intent.slots.Channel.value;
                    } else {
                        response.tell("I don't understand what you need.  Please try again");
                    }
                break;

            };
        } else {
            this.emit(':tell', "hmm... I don't know how to do that with Direct TV");
        }

        // Try and map the deviceId that is calling the service to one in your global devices object
        let deviceRoom = Object.keys(devices).find(key => devices[key] === deviceId);
        this.context.log('deviceRoom - ', deviceRoom)

        // get the room the directv unit is in.  If the user says the room at the end
        // of their statement, then we will specifically take action on the STB mapped
        // to that room in the global rooms object.  If the user does not add a room at 
        // the end of their statement, then we fall back to the trying to take action
        // on the STB that is in the same room as the Alexa device the user is 
        // speaking to.  If all else fails, we set the clientAddress to null and 
        // this will effectively cause Alexa to not be able to do anything.
        if (rooms[intent.slots.Room.value]) {
            clientAddress = '&clientAddr=' + rooms[intent.slots.Room.value];
        } else if (deviceRoom) {
            clientAddress = '&clientAddr=' + rooms[deviceRoom];
        } else {
            clientAddress = null;
        }

        this.context.log('clientAddress = ', clientAddress);

        if(clientAddress) {   
            let url = baseUrl + path + clientAddress;
            this.context.log('url - ', url);

            return fetch(url).then((res) => {
                if(res.ok) {
                    this.emit(':tell', alexaResponse);
                    return;
                } else {
                    this.context.log('error response - ', res.status);
                    switch(res.status){
                        case 403:
                            this.emit(':tell', "that channel is currently unavailable");
                        break;

                        default:
                            this.emit(':tell', "hmm... that didn't work");
                        break;
    
                    };
                    
                    return;
                }
            }).catch(error => {
                throw error;
            });   
        } else {
            this.emit(':tell', "hmm...I don't recognize that room");
            return;
        }

    }
}
