# Azure Function for integrating Alexa with DirecTV

This repository is intended to allow you to use Alexa to control your DirecTV Genie set top boxes (STB) within your network.  When you speak to Alexa, it will then forward key information to your Azure Function.  Your Azure Function will then make a `fetch` call to your local network to enact the command you want on your STB.  

The logic of this function is setup in such a way that you can use multiple Alexa devices in your network to control specific STB's in a certain room.  You can do this by including the name of the room when asking Alexa to do something, or with a bit of setup on your end, it will allow Alexa to intuitively know which STB to control based on the room you're in when speaking to Alexa.  

#### Important:
You have to enable port forwarding on your firewall to be able to get this Function to work.  You could port forward directly to your STB, but communication over the internet would only be http as the STB's don't understand SSL and as such, it would not be not encrypted.  I've included very basic instructions on how to setup and use NGINX further below.  

#### Getting setup and going:

First off, do the ususal `npm install` to get all the dependencies.

You'll want to sign up for an Amazon Developer account if you don't already have one.  Then you'll want to [create](https://developer.amazon.com/alexa/console/ask?) a Custom Skill for Alexa.  You can name the skill whatever you want.  The Invocation Name in the included `alexa-config.json` file in this repository uses the phrase `direct tv`.  When you ask Alexa to do something, you'll start with the phrase similar to `Alexa, ask Direct TV to...`.  

You can use the `alexa-config.json` to fully copy over the configuration that will include a large list of channels, utternances and such that you'll want to use to allow for flexibility when you are asking Alexa to do something.  The javascript code in the repository will use the parts of this configuration based on how Alexa passes information into it.  They are essentially tied together and changes to one, will greatly affect the other.  

Once you have the Alexa Skill setup, then in your Function's App Settings (or local.settings.json if testing locally), you'll want to add several settings past the normal default ones:
```
{
  "Values": {
    "ALEXA_APP_ID": "amzn1.ask.skill.f4ee...",          // the unique ID assigned to your Alexa skill. Use the online Alexa testing tool to get this ID.
    "HOSTNAME": "192.168.1.39",                         // the IP address of the NGINX server or without NGINX, your main STB IP address.  
                                                        // You will absolutely want to statically assign your main STB it's IP Address.
    "PORT": "8888",                                     // the port on the NGINX server, or if going straight to your STB, then it must be port 8080
    "USE_SSL": true,                                    // set to true if you want to reverse proxy with NGINX
    "SELF_SIGNED_SSL": true,                            // set to true if the SSL cert you use is self signed
    "NUMBER_OF_ROOMS": 4,                               // the number of rooms with STB's and/or Alexa devices
    
    "ROOM_1_NAME": "family room",                       // For each room, give it a name.  You must have the same number
    "ROOM_2_NAME": "living room",                       // of rooms that you have for NUMBER_OF_ROOMS as the code will
    "ROOM_3_NAME": "master bedroom",                    // iterate that many times to build objects that are used to help
    "ROOM_4_NAME": "test",                              // Alexa determine which room and STB to control.

    "ROOM_1_DTV_ADDRESS": "0",                          // the internal address used by the DirecTV genie. The main STB
    "ROOM_2_DTV_ADDRESS": "A0722C70200C",               // is always at address 0.  Otherwise, it's essentilaly a MAC 
    "ROOM_3_DTV_ADDRESS": "500959F60E3D",               // address
    "ROOM_4_DTV_ADDRESS": "0",
    
    "ROOM_1_DEVICE_ID": "amzn1.ask.device.AGE3M3...",   // the unique device ID assigned to an Alexa device.  This id is a
    "ROOM_2_DEVICE_ID": "amzn1.ask.device.AGE3M3...",   // unique id per Alexa skill.  The code will include console debug
    "ROOM_3_DEVICE_ID": "amzn1.ask.device.AGE3M3...",   // info that should expose this to you on a per device basis.
    "ROOM_4_DEVICE_ID": "amzn1.ask.device.AGE3M3..."
  }
}
```

To compile the code for testing locally, you can do a `npm run debug`.  Once you are ready to push up to Azure, you can do a `npm run build:prod`.

For the most part, this code should be pretty self sufficient and other than the settings above, it shouldn't require you do much customization to run.  Depending on your environment, the utternances in the `alexa-config.json` file might need adjusted to account for specific users or accents that are using Alexa.


#### NGINX Setup

1. Install a Linux distro of your choice.  
    *  In my case, I'm running it on VMWare Workstation.
    *  In my case, I used VMware's [Photon OS](https://vmware.github.io/photon/) as it includes Docker and has a pretty small footprint.  Follow the setup instructions there to get it and Docker up and running.
2. Create self signed SSL certs:  `openssl req -x509 -nodes -days 1000 -newkey rsa:2048 -keyout nginx.key -out nginx.crt`
3. Copy the three files in the NGINX folder to your folder of choice in Linux
    *  docker-compose.yml
    *  Dockerfile
    *  nginx.conf
4. Edit these files based on your specific needs for public/private IP Address and/or FQDN information.
5. Build the NGINX docker container: `docker build -t reverseproxy ./`
6. Bring up the container: `docker-compose up -d`



#### Testing Alexa out
Some key phrases to try:
  * Alexa, ask DirecTV to pause
  * Alexa, ask DirecTV to play
  * Alexa, ask DirecTV to pause in the Living Room
  * Alexa, ask DirecTV to go to ESPN
  * Alexa, ask DirecTV to go to HTV in the Family Room
  * Alexa, ask DirecTV to list recorded shows
  * Alexa, ask DirecTV to go Up
  * Alexa, ask DirecTV to Select
  * Alexa, ask DirecTV to Exit
  * Alexa, ask DirecTV to Fast Forward
  * Alexa, ask DirecTV to change to channel 202 in the Master Bedroom


Keep in mind that if you are asking Alexa to do something in a specific room other than the room you are in, it will in fact, do what you ask in the specific room you spoke.  In theory, this could allow you to control a STB in a room that someone else is watching.   


#### Credits:
  * If you are interested in the overall structure of this Function, you can check out my respository [Azure-Functions-ES6-Boilerplate](https://github.com/jawa-the-hutt/azure-functions-es6-boilerplate) for an example of how to use ES6 Javascript with Azure Functions.  
  * This Function uses the npm package `alexa-skill-sdk-for-azure-function` to get access to the Alexa javascript SDK in a way that makes sense when using Azure Functions.  You can check out RamjiP's excellent repository [here](https://github.com/RamjiP/alexa-skill-sdk-for-azure-function) and use it to create your own Alexa integrated Azure Functions.  
  * This repository is also based on a lot of the work done [here](https://github.com/bklavet/Echo-skill-to-control-Directv), but because it uses AWS Lambda functions, I have decided to create this one.