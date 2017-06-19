# Setup 


Run OpenHIM with Vagrant
- https://github.com/jembi/openhim-core-js/wiki/Running-the-OpenHIM-using-Vagrant
- setup core vagrant
    - `cd /var/www/git/Regenstrief/OHIE/certificate_renewal/ohim`
    - `mkdir core; cd core;`
    - `vagrant init ubuntu/trusty64;`
    - set provisioner
        - Create the provisioner file:
        ```
        cat > provision_ohim_core.sh <<EOF  
        ## based on instructions found at http://openhim.readthedocs.io/en/latest/getting-started.html#installing-the-openhim-core
        echo "Begin provisioning of provision_ohim_core.sh..."  
        
        ## Install Node.js, https://nodejs.org/en/download/package-manager/
        #mkdir -p /etc/puppet/modules;
        #puppet module install willdurand/nodejs
        curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
        sudo apt-get install -y nodejs  build-essential
        
        ## Install MongoDB, https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927;
        echo 'deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list;
        sudo apt-get update;
        sudo apt-get install -y mongodb-org;
        sudo service mongodb start
        
        ## Install git
        sudo apt-get -y install git
        
        ## Install the OpenHIM-core package globally
        sudo npm install openhim-core -g
        
        echo "Provisioning of provision_ohim_core.sh completed. [Success]."
        EOF
        ```
        - Create the virual machine config file:
        ```
        cat > virtual_machine_config.txt <<EOF
        # Configure Virtual Machine\n
        config.vm.provider "virtualbox" do |v|\n
            v.customize ["modifyvm", :id, "--memory", 1536]\n
        end\n
        EOF
        ```
        - Create the port forwarding config file:
        ```
        cat > port_forwarding.txt <<EOF
        # Configure port forwarding\n
        config.vm.network "forwarded_port", guest: 5000, host: 5000\n
        config.vm.network "forwarded_port", guest: 5001, host: 5001\n
        config.vm.network "forwarded_port", guest: 5050, host: 5050\n
        config.vm.network "forwarded_port", guest: 5051, host: 5051\n
        config.vm.network "forwarded_port", guest: 5052, host: 5052\n
        config.vm.network "forwarded_port", guest: 8080, host: 8080\n
        EOF
        ```
        - Create the `openhim-core` provision to start server on every `vagrant up`
        ```
        cat > always_run.txt <<EOF
        # Configure openhim-core to start every up\n
        config.vm.provision :shell, run: 'always', inline: 'openhim-core'
        EOF
        ```
        - Add configs and provisioners to the Vagrant file, before the last line
            ```
            contents=$(cat virtual_machine_config.txt); sed -i '$i'"$(echo $contents)" Vagrantfile;
            contents=$(cat port_forwarding.txt); sed -i '$i'"$(echo $contents)" Vagrantfile;
            sed -i '$i'"$(echo 'config.vm.provision "shell", path: "provision_ohim_core.sh"')" Vagrantfile;
            contents=$(cat always_run.txt); sed -i '$i'"$(echo $contents)" Vagrantfile;
            ```
    - Start the vagrant
        - `vagrant up --provider virtualbox`
    - Start the server
        - `openhim-core`
    - Test successful service
        - `https://localhost:8080/authenticate/root@openhim.org`
        
    
    
    
Test the `ohim-cert-updater` node package
- Setup the config.json file w/ only local machine
- Create a self signed test certificate
    - `sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/ohim-selfsigned.key -out /etc/ssl/certs/ohim-selfsigned.crt`
- Run it to test that local cert and key are updated
- Create another vagrant config with the same settings as above, except replace the port forwarding file by running the following:
    ```
rm port_forwarding.txt;
cat > port_forwarding.txt <<EOF
    # Configure port forwarding\n
    config.vm.network "forwarded_port", guest: 5000, host: 25000\n
    config.vm.network "forwarded_port", guest: 5001, host: 25001\n
    config.vm.network "forwarded_port", guest: 5050, host: 25050\n
    config.vm.network "forwarded_port", guest: 5051, host: 25051\n
    config.vm.network "forwarded_port", guest: 5052, host: 25052\n
    config.vm.network "forwarded_port", guest: 8080, host: 28080\n
EOF
    ```
or
    ```
rm port_forwarding.txt;
cat > port_forwarding.txt <<EOF
    # Configure port forwarding\n
    config.vm.network "forwarded_port", guest: 5000, host: 35000\n
    config.vm.network "forwarded_port", guest: 5001, host: 35001\n
    config.vm.network "forwarded_port", guest: 5050, host: 35050\n
    config.vm.network "forwarded_port", guest: 5051, host: 35051\n
    config.vm.network "forwarded_port", guest: 5052, host: 35052\n
    config.vm.network "forwarded_port", guest: 8080, host: 38080\n
EOF
    ```
    
    
    
    
    
    
    
    
    
    
    
    
    
# deprecated
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
- setup console vagrant
    - `cd /var/www/git/Regenstrief/OHIE/certificate_renewal/ohim`
    - `git clone https://github.com/jembi/openhim-console.git`
    - `cd openhim-console/infrastructure/development/env`
    - `vagrant up`
- run console vagrant
    - `cd /var/www/git/Regenstrief/OHIE/certificate_renewal/ohim/openhim-console/infrastructure/development/env`
    - `vagrant ssh`
    - `cd /openhim-console`
    - `grunt serve`
    
Open OpenHIM console
- `http://0.0.0.0:9000`





        sudo cat > /etc/systemd/system/mongodb.service <<-MONGO_CONFIG
        [Unit]
        Description=High-performance, schema-free document-oriented database
        After=network.target

        [Service]
        User=mongodb
        ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

        [Install]
        WantedBy=multi-user.target
        MONGO_CONFIG