# HairGuru

Barbers build up loyal followings over time. They are also frequently very busy. So much so, that they they don't have time to answer phone calls and take reservations from their patrons. Enter HairGuru. By setting up a friendly chatbot for the barbershop, HairGuru streamlines the process of getting that haircut appointment for the customers, as well as allows barbers to serve their clients better as they no longer have to be interrupted by the ringing of their phones.
<br>
* Chatbot built using Microsoft Azure Cloud Services and the Cognitive Services (LUIS: luis.ai)
* Allows customers to make reservations for barbershop appointments
* Provides basic information such as hours of operation, directions to the shop, and pricing

## USAGE

To run the app:

```
	node app.js
```

You will need to install the Bot Framework Emulator from [here](https://docs.botframework.com/en-us/tools/bot-framework-emulator/).
<br>
Open the Bot Framework Emulator, and enter
```
http://localhost:3978/api/messages
```
in the address bar. Leave App ID and Password blank. Hit connect and you can now chat with the chatbot!

## BUILD/INSTALLATION INSTRUCTIONS
  * All platforms

```
  	npm install
```

## Contributor Guide
[CONTRIBUTING.md](CONTRIBUTING.md)

## License 