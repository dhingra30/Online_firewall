# Online_firewall
An online platform which uses HTML, CSS, JavaScript and node.js to provide 2 terminals to the user for testing firewall rules

# Description
* This project uses different technologies to create a webpage with two terminals 
* One terminal acts as an insider which means its within a virtual network and the other terminal acts as the outsider (Outside the network)
* The terminals are used to test the firewall rules by either using the upload features to upload the firewall rules or use terminal's iptables functionality to input the firewall rules to the insider 
* The terminal can then be used to check the port status to confirm if the firewall rules are working
* The terminal also responds to the basic linux commands like Ipconfig, Nmap, iptables etc.

# Starter commands to test the functionality
* Insider: Type ipconfig into the insider's terminal to learn what its IP address is.
  Outsider: In the outsider terminal run nmap -p 80 [Insider IP address] to find out if port 80, which is commonly used by internet connections, is open.
* Insider: Close port 80 by typing iptables -A INPUT -dport 80 -j DROP
  Outsider: Run nmap -p 80 [Insider IP address] again to see if you have successfully closed the port.
* Outsider: Change the outsider's IP so they can test from a different location. set ip 166.155.72.10, this is not a standard linux command, but is very handy for our WebApp.

