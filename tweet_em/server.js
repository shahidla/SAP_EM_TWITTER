'use strict';

const fs = require('fs');
var sapcai = require('sapcai').default;
const axios = require('axios')
var client = new sapcai('f4a7XXXXXXXXXXc4217acb9efb');
var request = client.request;
var build = client.build;

var express = require('express');
var app = express();
const bodyParser = require("body-parser");
var aToken
app.use(bodyParser.json())

//EM
const clientID = 'sb-clone-xbem-service-broker-f38148cXXXXXXXXXXX|xbem-service-broker-!b24X6'
const clientSecret = '343aXXXXX-f093-45f6-80ec-30f2ed180a16$RDmHbwqMeXY0Bd'
const uri = 'https://58fXXXXXial.authentication.eu10.hana.ondemand.com/oauth/token';



var top_sr = 'https://enterprise-messaging-pubsub.cfapps.eu10.hana.ondemand.com/messagingrest/v1/topics/servicerequest/messages'
var top_doc = 'https://enterprise-messaging-pubsub.cfapps.eu10.hana.ondemand.com/messagingrest/v1/topics/document/messages'
var top_tweet = 'https://enterprise-messaging-pubsub.cfapps.eu10.hana.ondemand.com/messagingrest/v1/topics/twitter/messages'
var output

//AI SERVICES
const docoauth2url = 'https://58fXXXXXal.authentication.eu10.hana.ondemand.com/oauth/token'
const docclientid = 'sb-6XXXXXc15-c926-4ec3-XXXXXXXXXXX0417'
const docclientsecret = 'k2rxXXXXXXX00GA21d87Y='

// POST TWEET
function reply_tweet(status_id, reply2tweet) {
  //Send Doc
  console.log('status_id - ',status_id)
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://api.openconnectors.trial.eu10.ext.hana.ondemand.com/elements/api-v2/statuses',
    'headers': {
      'Authorization': 'User BCU5XXXXXXXXXXJn+wPi5OuJiXzweF9E3sxsXaOgu+vojOkPMV2qQfnQ=',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': 'lang=en'
    },
    body: JSON.stringify({
      "auto_populate_reply_metadata": true, "card_uri": "", "display_coordinates": true,
      "enable_dmcommands": true, "exclude_reply_user_ids": "", "fail_dmcommands": true,
      "in_reply_to_status_id": status_id,
      "lat": "", "long": "", "media_ids": [], "place_id": "", "possibly_sensitive": false,
      "status": reply2tweet, "trim_user": true
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
};

function send_doc(myMedia, idata) {
  //Send Doc
  var request = require('request');

  request({
    url: docoauth2url,
    method: 'POST',
    auth: {
      user: docclientid,
      pass: docclientsecret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (err, res) {
    var json = JSON.parse(res.body);
    //console.log("Access Token:", json.access_token);
    aToken = 'Bearer' + ' ' + json.access_token
    //console.log(aToken)

    var requestdoc = require('request')
    var file = requestdoc(myMedia)
    var request = require('request');
    var fs = require('fs');
    var options = {
      'method': 'POST',
      'url': 'https://aiservices-trial-dox.cfapps.eu10.hana.ondemand.com/document-information-extraction/v1/document/jobs',
      'headers': {
        'Accept': 'application/json',
        'Authorization': aToken
      },
      formData: {
        'file': {
          'value': file,
          'options': {
            'filename': 'invoice.jpg',
            'contentType': null
          }
        },
        'options': '{ "extraction":{ "headerFields":[ "documentNumber", "taxId", "purchaseOrderNumber", "shippingAmount", "netAmount", "senderAddress", "senderName", "grossAmount", "currencyCode", "receiverContact", "documentDate", "taxAmount", "taxRate", "receiverName", "receiverAddress" ], "lineItemFields":[ "description", "netAmount", "quantity", "unitPrice", "materialNumber" ] }, "clientId":"c_00", "documentType":"invoice", "receivedDate":"2020-02-17", "enrichment":{ "sender":{ "top":5, "type":"businessEntity", "subtype":"supplier" }, "employee":{ "type":"employee" } } }'
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);

      var docresp = JSON.parse(response.body)
      
     
      var final = Object.assign(docresp, idata);
      console.log(final); 

      setTimeout(function( ) {   
        send_message_em(final,'document')
      }, 20000);

      
    });
  });
};

function send_message_em(idata, topic) {
  //Send messages to EM
  var request = require('request');

  request({
    url: uri,
    method: 'POST',
    auth: {
      user: clientID,
      pass: clientSecret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (err, res) {
    var json = JSON.parse(res.body);
    //console.log("Access Token:", json.access_token);
    aToken = 'Bearer' + ' ' + json.access_token
    //console.log(aToken)
    var request = require('request');

    // SECOND Scenario - where EM WILL REPOND TO TWITTER
    if (topic == 'twitter') {

      var options = {
        'method': 'POST',
        'url': top_tweet,
        'headers': {
          'x-qos': '0',
          'Content-Type': 'application/json',
          'Authorization': aToken
        },
        body: JSON.stringify(idata)

      };
    }

    // FOURTH Scenario - where TWEET will be sent to EM & ABAP WILL REPOND TO TWITTER with Service request number
    if (topic == 'servicerequest') {
      var options = {
        'method': 'POST',
        'url': top_sr,
        'headers': {
          'x-qos': '0',
          'Content-Type': 'application/json',
          'Authorization': aToken
        },
        body: JSON.stringify(idata)

      };
    }

    // THIRD Scenario - where TWEET will be sent to EM & ABAP WILL REPOND TO TWITTER with Invoice Amount
    if (topic == 'document') {

      var options = {
        'method': 'POST',
        'url': top_doc,
        'headers': {
          'x-qos': '0',
          'Content-Type': 'application/json',
          'Authorization': aToken
        },
        body: JSON.stringify(idata)

      };
    }

    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });

  });
};

app.get('/', (req, res) => {
  res.send('Test')
});

app.post('/', (req, res) => {
  console.log(req.body)
  res.status(200).end()
})
 

app.post('/tweetreply', (req, res) => {
  console.log(req.body)
   

  var tweet = req.body.text
  var id_str = req.body.id_str
  console.log(tweet)
  
  
  build.dialog({ 'type': 'text', content: tweet}, { conversationId: 'CONVERSATION_ID' })
  .then(resp => {
    // Reply to tweet
   var reply = tweet + ' ' + ' Reply from SAP CAI. Triggered from Enterprise Messaging Webhook'
   reply_tweet(id_str,reply) 
   console.log(resp)
  })
  .catch(err => console.error('Something went wrong', err))  

  res.status(200).end()
})

// App Code
app.post('/cai', function (req, res) {

  //EXTRACT TWEET
  var data;

  try {
    //EXTRACT TWEET

    var myArray = req.body.message.raw.statuses;
    myArray.forEach(function (value) {

      request.analyseText(value.text) //twitter text here - send it via events enabled 'can I cancel FID 6465968?
        .then(function (res) {
          // Determine the Intent
          var intent = res.intent();
          var uuid = res.uuid;
          console.log(intent.slug)
          console.log(value.text)


          // First Scenario - where OPEN CONNECTORS WEBHOOK WILL REPOND TO TWITTER
          if (intent.slug === 'greetings' && intent.confidence > 0.7) {
            // Send Message to SAP Enterprise Messaging
            data = {
              text: value.text,
              id: value.id,
              id_str: value.id_str,
              in_reply_to_screen_name: value.in_reply_to_screen_name,
              in_reply_to_user_id: value.in_reply_to_user_id
            };

            
            build.dialog({ 'type': 'text', content: value.text }, { conversationId: 'CONVERSATION_ID' })
            .then(resp => {
              // Reply to tweet
             var reply = resp.messages[0].content + ' ' + ' Reply from SAP CAI. Triggered from Open Connectors Webhook'
             reply_tweet(value.id_str,reply) 
    
            })
            .catch(err => console.error('Something went wrong', err))  
          }

          // SECOND Scenario - where EM WILL REPOND TO TWITTER
          if (intent.slug === 'ask-feeling' && intent.confidence > 0.7) {
            // Send Message to SAP Enterprise Messaging
            data = {
              text: value.text,
              id: value.id,
              id_str: value.id_str,
              in_reply_to_screen_name: value.in_reply_to_screen_name,
              in_reply_to_user_id: value.in_reply_to_user_id
            };
            send_message_em(data, 'twitter')
          }

          // THIRD Scenario - where TWEET will be sent to EM & ABAP WILL REPOND TO TWITTER with Invoice Amount
          if (intent.slug === 'document' && intent.confidence > 0.7) {
            // Send Message to SAP Enterprise Messaging
            data = {
              "text1": value.text,
              "id1": value.id,
              "id_str": value.id_str,
              "in_reply_to_screen_name": value.in_reply_to_screen_name,
              "in_reply_to_user_id": value.in_reply_to_user_id
            };

            // AI Services
            var myMedia = value.extended_entities.media[0].media_url;
            send_doc(myMedia,data)

            
          }

          // FOURTH Scenario - where TWEET will be sent to EM & ABAP WILL REPOND TO TWITTER with Service request number
          if (intent.slug === 'service-request' && intent.confidence > 0.7) {
            // Send Message to SAP Enterprise Messaging
            data = {
              text: value.text,
              id: value.id,
              id_str: value.id_str,
              in_reply_to_screen_name: value.in_reply_to_screen_name,
              in_reply_to_user_id: value.in_reply_to_user_id
            };

            send_message_em(data, 'servicerequest')


          }  //if

        });

      }).catch(function (err) { })   //analysetext


  } catch (ex) { } //try

  res.send(data)
  res.status(200).end()
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Example app listening on port ' + port);
});


