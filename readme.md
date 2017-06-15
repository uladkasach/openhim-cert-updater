## api.js
This object manages making requests to each machine. Its primary purpose is to keep track of authentication information, such as the requried header data. 

It authenticates the user and generates the authentication header data for each machine, upon the first request to each machine, using the `api.retreive_authentication_headers_for_machine()` method. 


## config.js.example
This document stores an example configuration file, defining which data is required for this to opporate properly. It is an example file because the real file will contain sensitive information, such as passwords.  

#### Setup
- Ensure that you create a `config.json` file in the same directory (`cp config.js.example config.js`) and update the contents to your setup.

#### Notes
- `user` defines the authentication information that will be used to access every machine
- `machines` are machines that the certificate update process affects, including:
    - local machine, which is the machine which had it's certificates updated
    - remote machines, which are the machines that communicate with the local machine and need to be notified about the certificate update
