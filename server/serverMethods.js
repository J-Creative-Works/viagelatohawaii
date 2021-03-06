Accounts.config({
  forbidClientAccountCreation:true
});

Accounts.validateNewUser(function (user) {
  if(checkAuth('users')){
    return true;
  }
  throw new Meteor.Error(403, "Username must have at least 3 characters");
});

Meteor.methods({
  checkInstagram: function () {
    this.unblock();
    try {
      var url = process.env.INSTAGRAM_KEY;
      var result = HTTP.get(url);
      return result;
    } catch (e) {
      // Got a network error, time-out or HTTP error in the 400 or 500 range.
      return false;
    }
  },
  updateFlavorsOfTheDay:function(data){
    console.log(data);
    this.unblock();
    try {
      var userData = Meteor.user();
      var docs;
      if(checkAuth('flavors')){
        Flavors.update({},{$set:{day:false}},{multi:true});
        docs = Flavors.update({_id:{$in:data.data}},
                              {$set:{day:true}},
                              {multi:true});
      }
      return docs;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  createNewFlavor:function(data){
    this.unblock();
    if(data.flavorName){
      try{
        var userData = Meteor.user();
        var doc;
        if(checkAuth('flavors')){
          var images = data.images;
          var time = new Date().valueOf();
          var seasonal = data.seasonal ? true : false;
          var descript = data.description ? data.description : null;
          var newDoc = {
            flavorName:data.flavorName,
            description:descript,
            new:true,
            active:true,
            images:images,
            lastUpdated:time,
            created:time,
            day:false,
            seasonal:seasonal
          };
          doc = Flavors.insert(newDoc);
        }
        return doc;
      } catch (e){
        console.error(e);
        return false;
      }
    } else {
      return {errMsg:'you did not specify a flavor name'};
    }
  },

  saveFlavorChanges:function(data){
    this.unblock();
    if(data._id){
      try{
        var userData = Meteor.user();
        var doc;
        if(checkAuth('flavors')){
          var images = data.images;
          var time = new Date().valueOf();
          var seasonal = data.seasonal ? true : false;
          var descript = data.description ? data.description : null;
          var updateData = {
            flavorName:data.flavorName,
            description:descript,
            images:images,
            lastUpdated:time,
            seasonal:seasonal
          };
          doc = Flavors.update({_id:data._id}, {$set:updateData});
        }
        return doc;
      } catch (e){
        console.error(e);
        return false;
      }
    } else {
      return {errMsg:'save did not execute, not enough data'};
    }
  },

  deleteFlavor:function(id){
    this.unblock();
    if(id){
      var result = Flavors.remove({_id:id});
      return result;
    }
    return {errMsg:'you did not specify a flavor id'};
  },
  createNewPress:function(data){
    this.unblock();
    try{
      var docId;
      if(checkAuth('press')){
        var time = new Date().valueOf();
        var newDoc = lodash.assign(data,{
          lastUpdated:time,
          created:time,
          assetType:'pressMedia',
          assetAlias: 'Press Media'
        });

        docId = SiteMedia.insert(newDoc);
      } else {
        console.log('NOT AUTHORIZED');
      }
      return docId;
    } catch (e){
      console.error(e);
      return false;
    }
  },
  sendEmail: function (data) {
    var fromAddress = data.address;
    var name = data.name;
    var text = data.text;
    var to = 'viagelatohawaii@gmail.com';
    check([fromAddress, text], [String]);

    // Let other method calls from the same client start running,
    // without waiting for the email sending to complete.
    this.unblock();
    var verifyCaptchaResponse = verifyCaptcha(this.connection.clientAddress, data.recaptchaResponse);
    //console.log(verifyCaptchaResponse);
    if(verifyCaptchaResponse.data.success === false){
      return {ok:false, err:'could not verify captcha response'};
    }
    var subjectLine = name + ' writes from viagelatohawaii.com';
    var emailToVia = {
      to: to,
      from: fromAddress,
      subject: subjectLine,
      text: text
    };

    var confirmationSubjectLine = 'Thanks for contacting Via Gelato Hawaii'
    var confirmationText = '<div style="font-size:2em; font-weight:300;">Hi ' + name + ',</div><p>Thanks for contacting Via Gelato Hawaii.</p><p>If you made an inquiry, we will get back to you within 1 business day.  Note, we are closed on Mondays.</p><br><br><br><hr><div class="footer" style="display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display: flex; -webkit-flex-flow: row nowrap; -ms-flex-flow: row nowrap; flex-flow: row nowrap; -webkit-box-pack: start; -webkit-justify-content: flex-start; -ms-flex-pack: start; justify-content: flex-start; -webkit-box-align: center; -webkit-align-items: center; -ms-flex-align: center; align-items: center; width: 100%; "><img style="max-height:70px;" src="https://s3-us-west-2.amazonaws.com/viagelato/images/via-logo-sm.png" alt=""> <div class="via-info"><div>Via Gelato Hawaii</div><div>1142 12th Ave Honolulu, HI 96816</div><div>808-732-2800</div><div><a href="http://viagelatohawaii.com/">viagelatohawaii.com</a></div></div></div>';
    var confirmationEmail = {
      to: fromAddress,
      from: to,
      subject: confirmationSubjectLine,
      html: confirmationText
    };
    console.log('attempting to send email',emailToVia);
    Email.send(emailToVia);
    console.log('attempting to send email',confirmationEmail);
    Email.send(confirmationEmail);
    return {ok:true};
  },
  createNewUser:function(options){
    if(checkAuth('users')){
      this.unblock();
      return Accounts.createUser(options);
    } else {
      throw new Meteor.Error(403, 'NOT AUTHORIZED');
    }
  },
  deleteUser:function(id){
    if(checkAuth('users')){
      this.unblock();
      return Meteor.users.remove({_id:id});
    }
    throw new Meteor.Error(403, 'NOT AUTHORIZED');
  },
  updateUserAuths:function(data){
    if(checkAuth('users')){
      this.unblock();
      return Meteor.users.update({_id:data.id}, {$set:{'profile.authorizations':data.authorizations}});
    }
    throw new Meteor.Error(403, 'NOT AUTHORIZED');
  },
  createException:function(data){
    if(checkAuth('hours') && data){
      this.unblock();
      var dateVal = new Date().valueOf();
      var existingRecord = Hours.findOne({date:data.date, type:'exception'});
      if(existingRecord){
        record = lodash.assign(data,{modified:dateVal});
        return Hours.update({_id:existingRecord._id},{$set:record});
      } else {
        record = lodash.assign(data,{created:dateVal});
        return Hours.insert(record);
      }
    }
  },
  deleteException:function(id){
    if(checkAuth('hours')){
      this.unblock();
      return Hours.remove({_id:id});
    }
    throw new Meteor.Error(403, 'NOT AUTHORIZED');
  }

});

function checkAuth(cred){
  var userData = Meteor.user();
  if(userData && userData.profile.authorizations.indexOf(cred) >= 0){
    return true;
  }
  return false;
}

function verifyCaptcha(clientIP, response) {
  var captcha_data = {
      privatekey: process.env.RECAPTCHA_KEY,
      remoteip: clientIP,
      response: response
  };

  var serialized_captcha_data =
      'secret=' + captcha_data.privatekey +
      '&remoteip=' + captcha_data.remoteip +
      '&response=' + captcha_data.response;

  var captchaVerificationResult = null;

  try {
      captchaVerificationResult = HTTP.call("POST", "https://www.google.com/recaptcha/api/siteverify", {
          content: serialized_captcha_data.toString('utf8'),
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': serialized_captcha_data.length
          }
      });
  } catch (e) {
      console.log(e);
      return {
          'success': false,
          'error-codes': 'reCaptcha service not available'
      };
  }

  return captchaVerificationResult;
}
