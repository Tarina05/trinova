var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");
var app = express();

app.use(fileuploader());

app.use(express.static("public"));
app.use(express.urlencoded(true));

//for gemini work
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDbwiKEVYlyTYqw41HN3-aKVIiOeB7wiXk");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

//for nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // for Gmail, use 'gmail'; for others, use appropriate service
    auth: {
        user: 'tarinajethi620@gmail.com', // replace with your email
        pass: 'yueo wyad kglv mgpy' // use App Password if 2FA is on
    }
});

app.listen(2004, function () {
    console.log("Server started at port no :2004")
})

app.get("/hello", function (req, resp) {
    resp.write("Heyyy!!! How are you?");
    resp.end();
})

cloudinary.config({
    cloud_name: 'digg7ewbc',
    api_key: '274795153339812',
    api_secret: 'xnOTUZnNy-ZCO5dHd87OIwXSgXo'
});

let dbConfig = "mysql://avnadmin:AVNS_oXl3fonpG2iafeaRnHu@mysql-399d34bb-tarinajethi615-bb29.c.aivencloud.com:25726/nodejs_project";

let mySqlVen = mysql2.createConnection(dbConfig);
mySqlVen.connect(function (errKuch) {
    if (errKuch == null)
        console.log("AiVen Connected Successfulllyyy!!!!");
    else
        console.log(errKuch.message)
})

app.get("/index", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
})

app.use(express.urlencoded(true));

//-------------SIGNUP WITH AJAX----------------------
app.get("/sign-up", function (req, resp) {
    let emailid = req.query.txtEmail;
    let password = req.query.txtPwd;
    let utype = req.query.comboUser;

    mySqlVen.query("insert into users values(?,?,?,current_date(),1)", [emailid, password, utype], function (errKuch) {
        if (errKuch == null)
            resp.send("Sign-up successful! Please check your inbox for a welcome message.");
        else
            resp.send(errKuch.message);
    })

    let subject = "";
    let htmlBody = "";

    if (utype === "Player") {
        subject = "Welcome to Trinova, Player!";
        htmlBody = `
                        <div style="font-family:Arial, sans-serif; padding:15px;">
                            <h2 style="color:#2b6cb0;">Welcome to Trinova, Athlete! 🏃‍♂️</h2>
                            <p>We're thrilled to have you onboard as a <strong>Player</strong>.</p>
                            <p>Your journey into competitive sports starts now. Explore tournaments, represent your skills, and much more.</p>
                            <p>💡 <em>Tip:</em> Head to your dashboard to complete your profile and start exploring tournaments in your city!</p>
                            <hr>
                            <p><strong>Your Email:</strong> ${emailid}</p>
                            <p style="color:#38a169;">Let the games begin!</p>
                            <p>Team Trinova</p>
                        </div>
                    `;
    } else if (utype === "Organizer") {
        subject = "Welcome to Trinova, Organizer!";
        htmlBody = `
                        <div style="font-family:Arial, sans-serif; padding:15px;">
                            <h2 style="color:#d69e2e;">You're Officially an Organizer on Trinova! 🏆</h2>
                            <p>Hello and welcome to the <strong>Organizer's Hub</strong>!</p>
                            <p>You can now post your tournaments, manage entries, and connect with thousands of players.</p>
                            <p>🛠 <em>Organizer Dashboard:</em> Visit your dashboard to set up your first tournament and manage your organization details.</p>
                            <hr>
                            <p><strong>Your Email:</strong> ${emailid}</p>
                            <p style="color:#3182ce;">We're here to help you make every event unforgettable.</p>
                            <p>Team Trinova</p>
                        </div>
                    `;
    }

    let mailOptions = {
        from: 'tarinajethi620@gmail.com', // sender address
        to: emailid, // receiver address (the user who just signed up)
        subject: subject,
        html: htmlBody
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error("Error sending email: " + error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
})

//----------LOGIN WITH AJAX------------------------
app.get("/chk-login", function (req, resp) {
    mySqlVen.query("select * from users where emailid=? AND password=?", [req.query.txtEmail2, req.query.txtPwd2], function (err, allRecords) {
        if (allRecords.length == 0) {
            resp.send("Invalid");
        }
        else if (allRecords[0].status == 1) {
            resp.send(allRecords[0].utype);
        }
        else {
            resp.send("Blocked");
        }
    })
})

//----------SAVING THE DATA----------------------------

app.post("/save-data", async function (req, resp) {
    let picurl = "";
    if (req.files != null) {
        fName = req.files.ProfilePic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.ProfilePic.mv(fullPath);

        //to upload on cloud
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log(picurl);
        });

    }
    else
        picurl = "nopic.jpg"

    let emailid = req.body.txtEmail;
    let orgname = req.body.txtOrgName;
    let regnumber = req.body.txtRegNo;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;
    let sports = req.body.txtDeals;
    let website = req.body.txtWebsite;
    let insta = req.body.txtInsta;
    let head = req.body.txtOrgHead;
    let contact = req.body.txtContact;
    let otherinfo = req.body.txtOtherInfo;

    mySqlVen.query("insert into organizers values(?,?,?,?,?,?,?,?,?,?,?,?)", [emailid, orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo], function (errKuch) {
        if (errKuch == null)
            resp.send("Record Saved Successfulllyyy....Badhai");
        else
            resp.send(errKuch.message);
    })

})

//-----------UPDATING THE DATA---------

app.post("/modify-data", async function (req, resp) {
    let picurl = "";
    if (req.files != null) {
        fName = req.files.ProfilePic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.ProfilePic.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;
            console.log(picurl);
        });
    }

    else
        picurl = req.body.hdn;

    let emailid = req.body.txtEmail;
    let orgname = req.body.txtOrgName;
    let regnumber = req.body.txtRegNo;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;
    let sports = req.body.txtDeals;
    let website = req.body.txtWebsite;
    let insta = req.body.txtInsta;
    let head = req.body.txtOrgHead;
    let contact = req.body.txtContact;
    let otherinfo = req.body.txtOtherInfo;

    mySqlVen.query("update organizers set orgname=?, regnumber=?, address=?, city=?, sports=?, website=?, insta=?, head=?, contact=?, picurl=?, otherinfo=? where emailid=? ", [orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo, emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(emailid + "Updated Successfulllyyyy...");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch.message);
    })

})

//-----------------SEARCH BUTTON----------------
app.get("/get-one", function (req, resp) {
    mySqlVen.query("select * from organizers where emailid=?", [req.query.txtEmail], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})

//-------------TOURNAMENTS DETAIL DATA SAVE------------------------
app.get("/Publish-data", function (req, resp) {
    let emailid = req.query.txtEmail1;
    let eventt = req.query.txtEvent;
    let doe = req.query.txtDate;
    let toe = req.query.txtTime;
    let address = req.query.txtLoc;
    let city = req.query.txtCity1;
    let sports = req.query.comboSports;
    let minage = req.query.txtMin;
    let maxage = req.query.txtMax;
    let lastdate = req.query.txtDateOfReg;
    let fee = req.query.txtFee;
    let prize = req.query.txtPrize;
    let contact = req.query.txtContact1;


    mySqlVen.query("insert into tournaments values(null,?,?,?,?,?,?,?,?,?,?,?,?,?)", [emailid, eventt, doe, toe, address, city, sports, minage, maxage, lastdate, fee, prize, contact], function (errKuch) {
        if (errKuch == null)
            resp.send("Tournament Registered Successfulllyyy!!✅ A confirmation has been sent to your email.");
        else
            resp.send(errKuch.message);
    })

    let mailOptions = {
        from: 'tarinajethi620@gmail.com', // sender address
        to: emailid, // receiver address (the user who just signed up)
        subject: `🎉 Your Tournament "${eventt}" is Live on Trinova!`,
        html: `
        <div style="font-family: 'Segoe UI', sans-serif; color: #2c3e50; padding: 25px; background: #f8f9fa; border-radius: 8px;">
            <h2 style="color: #1e88e5;">✅ Tournament Successfully Registered!</h2>
            <p>Hey Organizer,</p>

            <p style="font-size: 15px;">
                Your tournament <strong>"${eventt}"</strong> has officially gone live on <strong>Trinova</strong>. Get ready to make waves in the sports world! Here's a snapshot of your event:
            </p>

            <div style="background: #ffffff; border-radius: 6px; padding: 15px 20px; margin: 15px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                <p><strong>🏟️ Sport:</strong> ${sports}</p>
                <p><strong>📅 Date:</strong> ${doe} &nbsp; <strong>🕒 Time:</strong> ${toe}</p>
                <p><strong>📍 Venue:</strong> ${address}, ${city}</p>
                <p><strong>👥 Age Group:</strong> ${minage} to ${maxage} years</p>
                <p><strong>💸 Registration Fee:</strong> ₹${fee}</p>
                <p><strong>🏆 Prize:</strong> ${prize}</p>
                <p><strong>🗓️ Register Before:</strong> ${lastdate}</p>
                <p><strong>📞 Contact:</strong> ${contact}</p>
            </div>

            <p style="font-size: 14px;">
                You can view or manage this tournament directly from your dashboard. Let the games begin!
            </p>

            <p style="margin-top: 25px; font-size: 13px; color: #777;">
                Thanks for trusting Trinova. We’re excited to see your tournament in action!<br>
                <em>— Team Trinova</em>
            </p>
        </div>
    `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error("Error sending email: " + error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
})

//--------MANAGE TOURNAMENTS---------------------------
app.get("/do-fetch-all-users", function (req, resp) {

    let emailid = req.query.emailidKuch;
    console.log("Received email id: ", emailid);
    mySqlVen.query("select * from tournaments where emailid=? ", [emailid], function (err, allRecords) {
        resp.send(allRecords);

    })
})

//-----------REMOVE TOURNAMNETS---------------------------
app.get("/delete-one", function (req, resp) {
    //console.log(req.query)
    let rid = req.query.ridKuch;

    mySqlVen.query("delete from tournaments where rid=?", [rid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(" Deleted Successfulllyyyy...");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch);

    })
})

//-------PLAYER DATA SAVE--------------------------------
app.post("/Upload-data", async function (req, resp) {

    let acardpicurl = "";
    if (req.files != null) {
        let fName = req.files.adharPic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        await req.files.adharPic.mv(fullPath);

        //to upload on cloud
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            acardpicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log(acardpicurl);
        });

    }
    else {
        acardpicurl = "nopic.jpg"
    }

    let profilepicurl = "";
    if (req.files != null) {
        let fName = req.files.ProfilePic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        await req.files.ProfilePic.mv(fullPath);

        //to upload on cloud
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            profilepicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log(profilepicurl);
        });

    }
    else {
        profilepicurl = "nopic.jpg"
    }

    let emailid = req.body.txtEmail;
    let name = req.body.txtName;
    let dob = req.body.txtDob;
    let gender = req.body.txtGen;
    let contact = req.body.txtContact;
    let address = req.body.txtAddress;
    let game = req.body.comboGames;
    let otherinfo = req.body.txtOtherInfo;

    mySqlVen.query("insert into players values(?,?,?,?,?,?,?,?,?,?)", [emailid, acardpicurl, profilepicurl, name, dob, gender, address, contact, game, otherinfo], function (errKuch) {
        if (errKuch == null)
            resp.send("Player's Record Saved Successfulllyyy");
        else
            resp.send(errKuch.message);
    })



})

//--------------------AI PIC READ-------------------------
async function RajeshBansalKaChirag(imgurl) {
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    console.log(jsonData);

    return jsonData

}

app.post("/picreader", async function (req, resp) {
    try {
        if (!req.files || !req.files.adharPic) {
            return resp.status(400).json({ error: "No file uploaded" });
        }

        let fileName = req.files.adharPic.name;
        let locationToSave = __dirname + "/public/uploads/" + fileName;
        await req.files.adharPic.mv(locationToSave);

        let picUrlResult = await cloudinary.uploader.upload(locationToSave);
        let jsonData = await RajeshBansalKaChirag(picUrlResult.url);

        resp.json(jsonData);

    } catch (err) {
        console.error(err);
        resp.status(500).json({ error: err.message });
    }
});


//----------PLAYERS DATA MODIFY---------------------------
app.post("/modify1-data", async function (req, resp) {

    let acardpicurl = "";
    if (req.files != null) {
        let fName = req.files.adharPic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.adharPic.mv(fullPath);

        //to upload on cloud
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            acardpicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log(acardpicurl);
        });

    }
    else {
        acardpicurl = req.body.hdn;
    }

    let profilepicurl = "";
    if (req.files != null) {
        let fName = req.files.ProfilePic.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        await req.files.ProfilePic.mv(fullPath);

        //to upload on cloud
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            profilepicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log(profilepicurl);
        });

    }
    else {
        profilepicurl = req.body.hdn;
    }

    let emailid = req.body.txtEmail;
    let name = req.body.txtName;
    let dob = req.body.txtDob;
    let gender = req.body.txtGen;
    let contact = req.body.txtContact;
    let address = req.body.txtAddress;
    let game = req.body.comboGames;
    let otherinfo = req.body.txtOtherInfo;

    mySqlVen.query("update players set acardpicurl=?,profilepicurl=?,name=?,dob=?,gender=?,address=?,contact=?, game=?,otherinfo=? where emailid=? ", [acardpicurl, profilepicurl, name, dob, gender, address, contact, game, otherinfo, emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(emailid + "Player's Record Updated Successfulllyyyy...");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch.message);
    })

})

//----SEARCH WITH AJAX THE PLAYER"S INFO.------------------
app.get("/get-player", function (req, resp) {
    mySqlVen.query("select * from players where emailid=?", [req.query.txtEmail], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})

//---------MANAGE USERS CONSOLE-------------------
app.get("/do-fetch-users-console", function (req, resp) {

    mySqlVen.query("select * from users", function (err, allRecords) {
        resp.send(allRecords);

    })
})

//----------BLOCK USER FROM ADMIN DASH----------------
app.get("/block-user", function (req, resp) {
    let emailid = req.query.emailidKuch;
    mySqlVen.query("update users set status=0 where emailid=?", [emailid], function (err, result) {
        if (err) {
            console.log(err);
        } else {
            resp.send("User blocked successfully");
        }
    });
});

//--------UNBLOCK USER FROM ADMIN DASH-------------------
app.get("/unblock-user", function (req, resp) {
    let emailid = req.query.emailidKuch;
    mySqlVen.query("update users set status=1 where emailid=?", [emailid], function (err, result) {
        if (err) {
            console.log(err);
        } else {
            resp.send("User unblocked successfully");
        }
    });
});

//-----------Explore events in player dashboard---------------------
app.get("/do-fetch-all-tournaments", function (req, resp) {
    console.log(req.query)
    mySqlVen.query("select * from tournaments where city=? and sports=?", [req.query.kuchCity, req.query.kuchGame], function (err, allRecords) {
        console.log(allRecords)
        resp.send(allRecords);
    })
})

//-----------Cities In Explore events in player dashboard-------------
app.get("/do-fetch-all-cities", function (req, resp) {
    mySqlVen.query("select distinct city from tournaments", function (err, allRecords) {
        resp.send(allRecords);
    })
})

//-----------Sports In Explore events in player dashboard-------------
app.get("/do-fetch-all-sports", function (req, resp) {
    mySqlVen.query("select distinct sports from tournaments", function (err, allRecords) {

        resp.send(allRecords);
    })
})

//--------MANAGE ORGANIZERS RECORD---------------------------
app.get("/do-fetch-organizer-details", function (req, resp) {

    mySqlVen.query("select * from organizers", function (err, allRecords) {
        resp.send(allRecords);
    })
})

//--------MANAGE PLAYERS RECORD---------------------------
app.get("/do-fetch-player-details", function (req, resp) {

    mySqlVen.query("select * from players", function (err, allRecords) {
        resp.send(allRecords);
    })
})

//---------CHANGE PASSWORD OF PLAYER IN SETTINGS OF PLAYER DASHBOARD------------
app.get("/do-change-Pwd", function (req, resp) {
    console.log(req.query);

    let email = req.query.email;
    let oldPwd = req.query.oldPwd;
    let newPwd = req.query.newPwd;

    mySqlVen.query("update users set password=? where emailid=? and password=?", [newPwd, email, oldPwd], function (err, result) {
        if (err) {
            console.log(err);
            resp.send({ status: "error", message: "Server error!" });
        } else {
            console.log(result);
            if (result.affectedRows == 1) {
                resp.send({ status: "success", message: "Password updated successfully." });
            } else {
                resp.send({ status: "fail", message: "Old password incorrect or user not found." });
            }
        }
    });
});
