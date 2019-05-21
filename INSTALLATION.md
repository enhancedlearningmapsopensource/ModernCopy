Modern Copy Server Build and Configuration
==========================================

Copyright © 2019 by The University of Kansas

Enhanced Learning Maps developed these materials under a grant from the Department of Education, PR/Award # S368A150013. Contents do not necessarily represent the policy of the Department of Education, and you should not assume endorsement by the Federal Government. Learning map materials are freely available for use by educators but may not be used for commercial purposes without written permission.

May 10, 2019

<!-- -->

# Contents
- Technical Recommendations
- LAMP Server Build
  - Detailed Installation Steps
  - Optional Steps
- Additional Server Configuration
  - Mail
    - Configure
    - Verify
  - Load Balancer
  - DNS
- Modern Copy Application
  - Installation
  - Application Database User
  - Configuration
    - Base
    - Additional
- Configuration Scripts
  - Show Configuration Script
  - Enable Email Script
  - Set Contact Email Script
  - Create User Script
  - Change Password Script
  - Verify User Script
  - Locator Tool Location Script

# Technical Recommendations
Modern Copy runs on a typical [LAMP](https://en.wikipedia.org/wiki/Lamp) server which is a server running <u>*L*</u>inux, <u>*A*</u>pache HTTP server, a <u>*M*</u>ySQL (or MariaDB) database and <u>*P*</u>HP.

The minimum recommended skillset and experience for installing, configuring and running the Modern Copy infrastructure is a Linux server administration background with at least 1 year of experience installing, configuring and maintaining Linux server systems.

The minimum recommended size for the Modern Copy virtual server is 2 cores (or virtual CPUs) and 4 GB of memory.

Additional infrastructure recommendations include:
* Configure the infrastructure according to your organization security standards.
* Setup daily backups.
* Run on highly available infrastructure.
* Have a set of “non-production” infrastructure used to test security patching and any other required changes.
* Run performance testing to insure that your infrastructure will handle your projected loads.
* Follow your organization security standards for patching and system updates.
* Follow your organizational processes for setting up a public facing web site.

# LAMP Server Build

These steps are based on documentation in the [AWS EC2 Linux User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html) for setting up a LAMP web server on Amazon Linux 2 but they can generally be used to install on any Red Hat/CentOS based Linux operating system.

These instructions have been tested on RHEL 7.6 and Amazon Linux 2.

## Detailed Installation Steps
-   Create a new server running RHEL 7.6 or Amazon Linux 2. We recommend a cloud based solution or a virtual server running on a virtualization platform.
    -   The steps in AWS would be similar to the following:
        -   Create EC2 Security Group for new virtual server.
            -   Allow SSH access from your local public IP.
            -   Allow HTTP from your local public IP.
            -   Allow HTTPS access from the public.
        -   Create EC2 Instance
            -   Operating System: Amazon Linux 2
            -   Network: Default VPC
            -   Storage: 30 GB GP2
            -   Add tags
            -   Security Group: &lt;select Security Group created in previous step&gt;

-   Connect to the new server. If a virtual server was created and you cannot connect locally, then connect using SSH. Here is a sample command for connecting to an Amazon EC2 virtual server instance with the default ec2-user and a key file stored in your local .ssh folder.

    `ssh ec2-user@<modern_copy_server_name> -i <key-file>`

-   Apply software updates.

    `sudo yum update -y`

-   Install and enable pre-requisite repositories for PHP. Install PHP 7.2 and common modules. Disable SELINUX for RHEL.

    -   Amazon Linux 2

        ```
        sudo amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2
        sudo yum install -y httpd mariadb-server
        ```

    -   RHEL 7.6

        ```
        sudo yum install -y httpd
        sudo yum install -y wget
        ```

        ```
        wget https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
        sudo rpm -ivh epel-release-latest-7.noarch.rpm
        sudo yum-config-manager --enable epel
        sudo yum install -y epel-release yum-utils
        sudo yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
        sudo yum-config-manager --enable remi-php72
        sudo yum install -y php php-common php-json php-pdo php-fpm php-cli php-mysqlnd
        ```

        - Create a MariaDB.repo

          `sudo vi /etc/yum.repos.d/MariaDB.repo`

          - Add the following text to MariaDB.repo:
            ```
            # MariaDB 10.3 RedHat repository list - created 2019-03-28 19:38 UTC
            # http://downloads.mariadb.org/mariadb/repositories/
            [mariadb]
            name = MariaDB
            baseurl = http://yum.mariadb.org/10.3/rhel7-amd64
            gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
            gpgcheck=1
            ```

        - Install MariaDB

          `sudo yum install -y MariaDB MariaDB-server MariaDB-client`

        - Change SELinux to Permissive

          `sudo vi /etc/selinux/config`

          - Update the line starting with “SELINUX=” to be “SELINUX=permissive”.

        - Reboot to apply change

          `sudo shutdown -r now`

        - Log back in to continue work

          `ssh ec2-user@<modern_copy_server_name> -i <key>`

-   Start Apache HTTPD and ensure it is enabled after a reboot
    ```
    sudo systemctl start httpd
    sudo systemctl enable httpd
    sudo systemctl is-enabled httpd
    sudo systemctl status httpd
    ```

-   Verify web server is running:

    `
    curl -i http://localhost
    `

    *or*

    `
    http://<modern_copy_server_name>
    `

-   Configure groups and file permissions

    ```
    sudo usermod -a -G apache ec2-user
    groups
    ```

    Log out and log back in to verify permissions.

    `exit`

    `ssh ec2-user@<modern_copy_server_name> -i <key>`

    ```
    groups
    sudo chown -R ec2-user:apache /var/www
    sudo chmod 2775 /var/www && find /var/www -type d -exec sudo chmod 2775 {} \;
    find /var/www -type f -exec sudo chmod 0664 {} \;
    ```

-   Test LAMP Server
    -   Create a simple PHP info web site.

        `echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php`

    -   Access the simple PHP web site in a browser.

        `curl -i http://localhost/phpinfo.php`

        *or*

        `http://<modern_copy_server_name>/phpinfo.php`

    -   Delete the simple PHP info web site file.

        `rm /var/www/html/phpinfo.php`

-   Enable HTTPS. If running in AWS behind an Elastic Load Balancer (ELB), then a self-signed certificate is sufficient.

    (For reference see <https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/SSL-on-an-instance.html> )


    ```
    sudo yum install -y mod_ssl
    sudo shutdown -r now
    ssh ec2-user@<modern_copy_server_name> -i <key>
    ```

-   Confirm HTTPS is enabled.

    `curl -i -k https://localhost`

-   Configure, start and secure database

    `sudo vi /etc/my.cnf`

     - Add the following text to the __my.cnf__ MariaDB configuration file after the `[mysqld]` line:
       ```
       # Store table names in lower case and comparisons are not case sensitive
       lower_case_table_names=1

       ```

    ```
    sudo systemctl start mariadb
    sudo mysql_secure_installation
    ```

    Initial root password is none so press \[Enter\] when prompted for root password.

    Enter Y to set a root password. Be sure not to forget the root
    password that is set.

    Enter Y to remove anonymous users.

    Enter Y to disallow root login remotely.

    Enter Y to remove test database.

    Enter Y to reload privileges table.


    ```
    sudo systemctl enable mariadb
    sudo systemctl status mariadb
    ```

## Optional Steps
-   Install phpMyAdmin for database administration.
    -   Installation

        ```
        sudo yum install -y php-mbstring
        sudo systemctl restart httpd
        sudo systemctl restart php-fpm
        cd /var/www/html
        wget https://www.phpmyadmin.net/downloads/phpMyAdmin-latest-all-languages.tar.gz
        mkdir phpMyAdmin && tar -xvzf phpMyAdmin-latest-all-languages.tar.gz -C phpMyAdmin --strip-components 1
        rm phpMyAdmin-latest-all-languages.tar.gz
        ```

    -   Verify the installation.

        `curl -i -k https://localhost/phpMyAdmin/`


# Additional Server Configuration

## Mail

Mail configuration is optional but strongly recommended. Without mail configuration user management such as creating users and changing passwords will require a system administrator to execute shell scripts on the Modern Copy server.

### Configure
Configure email on the EC2 instance according to your IT department specifications.

Typical steps might include:
  -   backup **/etc/postfix/main.cf**
  -   create new **/etc/postfix/main.cf**
  -   add **sasl_passwd**
  -   create **sasl_passwd.db**

      `postmap hash:/etc/postfix/sasl_passwd`

  -   install **sasl** libaries
      ```
      sudo yum list installed | grep sasl
      sudo yum install -y cyrus-sasl cyrus-sasl-lib cyrus-sasl-plain
      ```
  -   restart __postfix__
      ```
      sudo postfix reload
      sudo systemctl restart postfix
      sudo systemctl status postfix -l
      ```

### Verify

-   Method 1

    `echo "Subject: mail test" | sendmail -v <your_email_address>`

-   Method 2
    ```
    sendmail -vt <your_email_address> <<-endmail
    Subject: mail test

    This is a test.
    endmail
    ```

## Load Balancer

The following steps are not required but simplify securing and configuring an AWS implementation. These steps are specific to an AWS implementation. Similar steps would be required for other cloud solutions. For a local installation, please work with your local IT support.

-   Create EC2 Target Group
    -   Configuration
        -   Target type: instance
        -   Protocol: HTTPS
        -   Port: 443
        -   VPC: &lt;same VPC as your Modern Copy EC2 instance&gt;
        -   Health Check Protocol: HTTPS
        -   Path: /
    -   Add Modern Copy EC2 instance as a target.
    
        Note: Instance will not become healthy until after Modern Copy application is installed.

-   Create a certificate in Certificate Manager to allow HTTPS for the
    Modern Copy web site. The name on the certificate will need to match
    the DNS name used for accessing the Modern Copy website.

-   Create an EC2 Security Group for Application Load Balancer
    -   Allow HTTP and HTTPS from public

-   Create an EC2 Application Load Balancer
    -   Basic Configuration
        -   Internet-facing
        -   IP address type: ipv4
        -   Load Balancer Protocol and Port: HTTPS and 443
        -   VPC: &lt;same VPC as your Modern Copy EC2 instance&gt;
        -   Select all Availability Zones
        -   Add desired Tags
    -   Security Configuration
        -   Select certificate for Modern Copy URL
        -   Select a security policy which limits connections to TLS 1.2
    -   Security Groups
        -   Select existing ALB Security Group created previously
    -   Routing
        -   Select existing Target Group just created
    -   After ALB is created, add HTTP listener that redirects to HTTPS (**Be sure to specify port 443**)

## DNS
-   Create a DNS record for accessing the Modern Copy website.

-   For a cloud solution the DNS record should be public. For a solution running on an internal network the DNS record may be private as long as all of the devices accessing the website can resolve the name.

-   For an AWS solution with an Application Load Balancer, the DNS record should be a CNAME record pointing to the load balancer public DNS name.

-   For an AWS solution that has an EC2 instance with a public IP, the IP should be a public static Elastic IP and the DNS record should be a DNS A record pointing to the static public IP.

# Modern Copy Application

## Installation

-   Copy source and supporting packages to Modern Copy server.
    ```
    cd ~
    wget https://github.com/EnhancedLearningMapsOpenSource/ModernCopy/archive/elm-build-v20190503.tar.gz     -O elm-build.tar.gz
    wget https://github.com/EnhancedLearningMapsOpenSource/ModernCopy/archive/db-v20190503.tar.gz            -O db.tar.gz
    wget https://github.com/EnhancedLearningMapsOpenSource/ModernCopy/archive/resources-v20190503.tar.gz     -O resources.tar.gz
    wget https://github.com/EnhancedLearningMapsOpenSource/ModernCopy/archive/admin-scripts-v20190503.tar.gz -O admin-scripts.tar.gz
    ```

-   Install Modern Copy application source:
    ```
    cd /var/www/html
    tar -xvf ~/elm-build.tar.gz
    ls -al
    ```

-   Add Modern Copy data configuration:
    ```
    cd /var/www/html
    tar -xvf ~/db.tar.gz
    ls -al
    ```

-   Add Modern Copy resources:
    ```
    mkdir -p /var/www/html/elm/assets/uploads
    cd /var/www/html/elm/assets/uploads
    tar -xvf ~/resources.tar.gz
    ls -al
    ```

-   Set file permissions again so that Modern Copy file permissions are set properly
    ```
    sudo chown -R ec2-user:apache /var/www
    sudo chmod 2775 /var/www && find /var/www -type d -exec sudo chmod 2775 {} \;
    find /var/www -type f -exec sudo chmod 0664 {} \;
    ```

-   Add Modern Copy administration scripts:
    ```
    cd ~
    tar -xvf ~/admin-scripts.tar.gz
    chmod 750 ~/admin-scripts/*.sh
    ls -al
    ls -al admin-scripts
    ```

## Application Database User
-   Create a database user ('elm_debug_user'@'localhost') for the application and grant permission to elm_release database objects.

    - Access the database as root

      `mysql --user=root -p`

    - Run the following queries and commands within the database.

      Note: Be sure to specify a secure password for the create user command.

      ```
      select * from mysql.user;
      create user 'elm_debug_user'@'localhost' identified by '<password>';
      grant all privileges on elm_release.* to 'elm_debug_user'@'localhost';
      flush privileges;
      select user, host from mysql.user order by 1, 2;
      \q
      ```

## Configuration

### Base

-   Within a local Chrome or Firefox browser run Modern Copy setup process.

    https://<modern_copy_url>/index.php


-   Select “elm.sql” in the database file drop down list.

-   Enter database root password.

-   Enter ELM User ('elm_debug_user'@'localhost') password.

-   Click ok button.

-   After data is loaded, scroll down below the ELM Software Setup Log and click the link to “Continue to Site”.


-   Verify that the Modern Copy login page appears.


### Additional

Scripts are available for additional configuration in the Configuration Scripts Section.

Note: Modern Copy currently finishes the final installation & configuration steps after the first person logs in. To complete the installation and configuration, the following steps will be necessary before running any of the configuration scripts:

-   Create an administrative user with the create user script 

-   Log in to Modern Copy with that administrative user

At a minimum be sure to run the script for setting the contact email address. Review the other scripts and run as needed.

If you enabled email on the server, then you should run the script to enable email for Modern Copy.

User management scripts are available for adding users and changing passwords. These are necessary when mail is not available.


# Configuration Scripts

This section provides scripts that may be used for configuring Modern Copy.

Administrative scripts were installed in a previous step to:
   ~/admin-scripts/

Run script without any parameters to view usage options.


## Create User Script

Name: `create_user.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

URL="https://localhost/database/login/create-user.php"

if [[ $# -ne 2 ]]; then
  echo "USAGE ERROR: $0 <email> <password>"
  exit 1
else
  USER_EMAIL=$1
  USER_PASS=$2
fi

create_user () {
  local USER_EMAIL=$1
  local USER_PASS=$2

  echo "User e-mail is ${USER_EMAIL}"
  #echo "User password is ${USER_PASS}"

  #curl -i -k --data "email=mark.thompson@ku.edu&pass=BadPass1" -X POST "${URL}"
  #curl -i -k --data '{"email":"mark.thompson@ku.edu","pass":"BadPass1"}' -X POST -H "Content-Type: application/json" "${URL}"

  #DATA="'"'{"email":"'${USER_EMAIL}'", "pass":"'${USER_PASS}'"}'"'"
  #CONTENT_TYPE="Content-Type: application/json" "${URL}"

  DATA="email=${USER_EMAIL}&pass=${USER_PASS}"
  CONTENT_TYPE="Content-Type: application/x-www-form-urlencoded"

  #echo curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
  curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
}

create_user "${USER_EMAIL}" "${USER_PASS}"
```


## Set Contact Email Script

Name: `set_contact.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

#DB_SERVER=localhost
ELM_DB_USER=elm_debug_user
ELM_DB_NAME=elm_release
CONFIG_TABLE=ELM_CONFIG
CONTACT_KEY=CONTACT_EMAIL

if [[ $# -ne 1 ]]; then
  USAGE_ERROR=TRUE
else
  USAGE_ERROR=FALSE
  EMAIL=$1
fi

if [[ ${USAGE_ERROR} = "TRUE" ]]; then
  echo "USAGE ERROR: $0 <contact_email_address>"
  echo
  exit 1
fi

echo
echo This command updates the configuration for the
echo CONTACT email address in the local elm_release database.
echo
echo Email contact will be set to ${EMAIL}
echo

echo You will be prompted to enter the elm_debug_user password...

# Read Password
echo -n Password:
read -s PASSWORD
#echo
#echo Password supplied: $PASSWORD

set_contact() {
  #cat <<-endsql
  mysql --user=${ELM_DB_USER} --password=${PASSWORD} <<-endsql

  use ${ELM_DB_NAME};

  /*
  SELECT * FROM ${CONFIG_TABLE} WHERE CODE = '${CONTACT_KEY}';
  */

  DELETE FROM ${CONFIG_TABLE} WHERE CODE = '${CONTACT_KEY}';

  INSERT INTO ${CONFIG_TABLE} (code, val)
    VALUES ('${CONTACT_KEY}', '${EMAIL}');

  /*
  SELECT * FROM ${CONFIG_TABLE} WHERE CODE = '${CONTACT_KEY}';
  */
endsql
}

set_contact

echo
```


## Show Configuration Script

Name: `show_config.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

#DB_SERVER=localhost
ELM_DB_USER=elm_debug_user
ELM_DB_NAME=elm_release
CONFIG_TABLE=ELM_CONFIG

echo
echo "This command displays the ELM configuration”
echo “in the local ${ELM_DB_NAME} database."
echo
echo "You will be prompted to enter the ${ELM_DB_USER} password..."
echo

# Read Password
echo -n Password:
read -s PASSWORD
echo
#echo Password supplied: $PASSWORD

show_config_item() {
  local DESC=$1
  local KEY=$2

  VAL=$(echo "SELECT VAL FROM ${ELM_DB_NAME}.${CONFIG_TABLE} " \
             "WHERE CODE = '${KEY}' ORDER BY CODE;" \
           | mysql --user=${ELM_DB_USER} --password=${PASSWORD} | grep -v VAL )
  
  echo "${DESC} ${VAL}"
}

echo

show_config_item 'Locater Tool URL: ' LOCATER_TOOL_PATH
show_config_item 'Mail Enabled: '     SELF_CREATION_ON
show_config_item 'Contact Email: '    CONTACT_EMAIL

echo
```


## Enable Email Script

Name: `enable_mail.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

#DB_SERVER=localhost
ELM_DB_USER=elm_debug_user
ELM_DB_NAME=elm_release
CONFIG_TABLE=ELM_CONFIG

if [[ $# -ne 1 ]]; then
  USAGE_ERROR=TRUE
elif [[ $1 != "FALSE" && $1 != "TRUE" ]]; then
  USAGE_ERROR=TRUE
else
  USAGE_ERROR=FALSE
  MAIL_ENABLED=$1
fi

if [[ ${USAGE_ERROR} = "TRUE" ]]; then
  echo "USAGE ERROR: $0 <TRUE|FALSE>"
  echo
  echo Need to pass TRUE or FALSE as a parameter depending
  echo on whether or not mail should be enabled.
  echo
  exit 1
fi

echo
echo This command updates the MAIL ENABLED configuration
echo in the local elm_release database.
echo
echo Mail enabled will be set to ${MAIL_ENABLED}
echo

echo You will be prompted to enter the elm_debug_user password...

#cat <<-endsql
mysql -u ${ELM_DB_USER} -p <<-endsql
  use ${ELM_DB_NAME};

  UPDATE ${CONFIG_TABLE}
    SET VAL = '${MAIL_ENABLED}'
    WHERE CODE = 'SELF_CREATION_ON';
endsql

echo
```


## Change Password Script

Name: `change_password.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

URL="https://localhost/database/login/change-password.php"

if [[ $# -ne 2 ]]; then
  echo "USAGE ERROR: $0 <email> <password>"
  exit 1
else
  USER_EMAIL=$1
  USER_PASS=$2
fi

change_password () {
  local USER_EMAIL=$1
  local USER_PASS=$2

  echo "User e-mail is ${USER_EMAIL}"
  #echo "User password is ${USER_PASS}"

  #curl -i -k --data "email=mark.thompson@ku.edu&pass=BadPass2" -X POST "${URL}"

  #DATA="'"'{"email":"'${USER_EMAIL}'", "pass":"'${USER_PASS}'"}'"'"
  #CONTENT_TYPE="Content-Type: application/json" "${URL}"

  DATA="email=${USER_EMAIL}&pass=${USER_PASS}"
  CONTENT_TYPE="Content-Type: application/x-www-form-urlencoded"

  #echo curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
  curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
}

change_password "${USER_EMAIL}" "${USER_PASS}"
```


## Verify User Script

Name: `verify_user.sh`

```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

URL="https://localhost/database/login/verify-user.php"

if [[ $# -ne 2 ]]; then
  echo "USAGE ERROR: $0 <email> <password>"
  exit 1
else
  USER_EMAIL=$1
  USER_PASS=$2
fi

verify_user () {
  local USER_EMAIL=$1
  local USER_PASS=$2

  echo "User e-mail is ${USER_EMAIL}"
  #echo "User password is ${USER_PASS}"

  #curl -i -k --data "email=<username>&pass=<password>" -X POST "${URL}"

  #DATA="'"'{"email":"'${USER_EMAIL}'", "pass":"'${USER_PASS}'"}'"'"
  #CONTENT_TYPE="Content-Type: application/json" "${URL}"

  DATA="email=${USER_EMAIL}&pass=${USER_PASS}"
  CONTENT_TYPE="Content-Type: application/x-www-form-urlencoded"

  #echo curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
  curl -i -k --data "${DATA}" -X POST -H "${CONTENT_TYPE}" "${URL}"
}

verify_user "${USER_EMAIL}" "${USER_PASS}"
```


## Locator Tool Location Script

Name: `set_locater.sh`

To disable use of Locater: `~/admin-scripts/set-locater.sh ""`

To enable use of Locater Tool within Modern Copy: `~/admin-scripts/set-locater.sh "https://locater.sampledomain.org/locatertool/login2"`

Script:
```
#!/bin/bash

# Written by Mark Thompson (Agile Technology Solutions)
# for ELM Modern Copy administration

#DB_SERVER=localhost
ELM_DB_USER=elm_debug_user
ELM_DB_NAME=elm_release
CONFIG_TABLE=ELM_CONFIG

if [[ $# -ne 1 ]]; then
  USAGE_ERROR=TRUE
else
  USAGE_ERROR=FALSE
  LOCATER_URL=$1
fi

if [[ ${USAGE_ERROR} = "TRUE" ]]; then
  echo "USAGE ERROR: $0 <LOCATER_URL>"
  echo
  echo The Locater Tool URL must be supplied as a parameter.
  echo .e.g. $0 "https://my-locater-server/locatertool/login2"
  echo
  echo To clear the Locater Tool URL, supply an empty string as the parameter.
  echo
  exit 1
fi

echo
echo This command updates the Locater Tool URL
echo configuration in the local "${ELM_DB_NAME}" database.
echo
echo Locater URL will be set to "${LOCATER_URL}"
echo

echo You will be prompted to enter the ${ELM_DB_USER} password...

#cat <<-endsql
mysql -u ${ELM_DB_USER} -p <<-endsql

  use ${ELM_DB_NAME};

  UPDATE ${CONFIG_TABLE}
    SET VAL = '${LOCATER_URL}'
    WHERE CODE = 'LOCATER_TOOL_PATH';
endsql

echo
```

