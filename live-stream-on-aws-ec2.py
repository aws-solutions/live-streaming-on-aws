######################################################################################################################
#  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://aws.amazon.com/asl/                                                                                    #
#                                                                                                                    #
#  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
import boto3
from botocore.vendored import requests
import json
import hashlib
import time
import urlparse
import urllib2
import xml.etree.ElementTree as Tree
from shutil import copyfile
import re

# function to update xml templates
def mod_xml(xml, find, replace):
    f = open(xml, 'r')
    xmldata = f.read()
    f.close()
    newdata = xmldata.replace(find, replace)
    f = open(xml, 'w')
    f.write(newdata)
    f.close()


# Elemental authenticated request
def elemental(method, user, apikey, inputurl, xml):
    # type: (GET, PUSH, DELETE) -> method
    futuretime2 = 2
    currenttime = time.time()
    finaltime = int(currenttime + futuretime2 * 60)
    parsed = urlparse.urlparse(inputurl)
    url = parsed.path
    # creating the final hash information
    prehash = "%s%s%s%s" % (url, user, apikey, finaltime)
    mdinner = hashlib.md5(prehash).hexdigest()
    prehash2 = "%s%s" % (apikey, mdinner)
    finalhash = hashlib.md5(prehash2).hexdigest()
    # create request
    req = urllib2.Request(inputurl)
    req.get_method = lambda: method
    req.add_header("Content-type", "application/xml")
    req.add_header("Accept", "application/xml")
    req.add_header("X-Auth-User", user)
    req.add_header("X-Auth-Expires", finaltime)
    req.add_header("X-Auth-Key", finalhash)
    if xml:
        req.add_data(xml)
    r = urllib2.urlopen(req)
    return r

# Lists
event_ids = []
output_ids = []
input_ids = []
delta_hosts = []
# get Delta Internal Hostnames
for d in deltas:
    response = elemental("GET", user, apikey, "https://" + d + "/settings/network", "")
    response = Tree.parse(response).getroot()
    delta = response[0].text
    delta_hosts.append(delta)

# create delta input/output filters
for d in deltas:
    copyfile("xml/output.xml", "/tmp/output.xml")
    mod_xml("/tmp/output.xml", "STACK", stackname)
    xml = open("/tmp/output.xml", "r")
    xml = xml.read()
    response = elemental("POST", user, apikey, "https://" + d + "/api/output_templates", xml)
    response = Tree.parse(response).getroot()
    out_id = response[0].text
    output_ids.append(out_id)
    # create input filter from xml and output id
    copyfile("xml/input.xml", "/tmp/input.xml")
    mod_xml("/tmp/input.xml", "OUT", out_id)
    mod_xml("/tmp/input.xml", "STACK", stackname)
    xml = open("/tmp/input.xml", "r")
    xml = xml.read()
    response = elemental("POST", user, apikey, "https://" + d + "/api/input_filters", xml)
    response = Tree.parse(response).getroot()
    in_id = response.attrib.get('href')
    in_id = re.sub('/input_filters/', '', in_id)
    input_ids.append(in_id)
# configure Demo stream
if source == "Demo":
    # get Live nodes IPs
    response = elemental("GET", user, apikey, "https://" + live + "/api/nodes/" + nodes[0], "")
    response = Tree.parse(response).getroot()
    ip1 = response[3].text
    response = elemental("GET", user, apikey, "https://" + live + "/api/nodes/" + nodes[2], "")
    response = Tree.parse(response).getroot()
    ip2 = response[3].text

    copyfile("xml/live.xml", "/tmp/live.xml")
    copyfile("xml/demo.xml", "/tmp/demo.xml")
    mod_xml("/tmp/demo.xml", "STACK", stackname)
    mod_xml("/tmp/demo.xml", "NODE", nodes[4])
    mod_xml("/tmp/demo.xml", "OUT1", ip1)
    mod_xml("/tmp/demo.xml", "OUT2", ip2)
    xml = open("/tmp/demo.xml", "r")
    xml = xml.read()
    response = elemental("POST", user, apikey, "https://" + live + "/api/live_events", xml)
    # Get event id
    response = Tree.parse(response).getroot()
    demo_id = response[0].text
    # Start Live Event
    elemental("POST", user, apikey, "https://" + live + "/api/live_events/" + demo_id + "/start",
  "<start>" + demo_id + "</start>")

else:
    # Update live xml with source
    copyfile("xml/live.xml", "/tmp/live.xml")
    mod_xml("/tmp/live.xml", "rtp://localhost:5001", source)
    demo_id = "null"
event_ids.append(demo_id)

# Create Live Event 1
copyfile("/tmp/live.xml", "/tmp/live1.xml")
mod_xml("/tmp/live1.xml", "STACK", stackname)
mod_xml("/tmp/live1.xml", "DELTA", delta_hosts[0])
mod_xml("/tmp/live1.xml", "NODE", nodes[0])
xml = open("/tmp/live1.xml", "r")
xml = xml.read()
response = elemental("POST", user, apikey, "https://" + live + "/api/live_events", xml)
# Get event id
response = Tree.parse(response).getroot()
event_id = response[0].text
# Start Live Event
elemental("POST", user, apikey, "https://" + live + "/api/live_events/" + event_id + "/start",
          "<start>" + event_id + "</start>")
event_ids.append(event_id)

# Create Live Event 2
copyfile("/tmp/live.xml", "/tmp/live2.xml")
mod_xml("/tmp/live2.xml", "STACK", stackname)
mod_xml("/tmp/live2.xml", "DELTA", delta_hosts[1])
mod_xml("/tmp/live2.xml", "NODE", nodes[2])
xml = open("/tmp/live2.xml", "r")
xml = xml.read()
response = elemental("POST", user, apikey, "https://" + live + "/api/live_events", xml)
# Get event id
response = Tree.parse(response).getroot()
event_id = response[0].text
# Start Live Event
elemental("POST", user, apikey, "https://" + live + "/api/live_events/" + event_id + "/start",
          "<start>" + event_id + "</start>")
event_ids.append(event_id)
