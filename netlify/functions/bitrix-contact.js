exports.handler = async function (event) {

    // =========================================================
    // ONLY ALLOW POST REQUESTS
    // =========================================================

    if (event.httpMethod !== "POST") {

        return {
            statusCode: 405,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };

    }


    try {

        // =========================================================
        // READ JSON REQUEST
        // =========================================================

        const data =
            JSON.parse(event.body || "{}");


        // =========================================================
        // GET FORM DATA
        // =========================================================

        const name =
            String(data.name || "").trim();

        const email =
            String(data.email || "").trim();

        const phone =
            String(data.phone || "").trim();

        const service =
            String(data.service || "").trim();

        const source =
            String(data.source || "").trim();

        const enquiryType =
            String(data.enquiry_type || "").trim();

        const subject =
            String(data.subject || "").trim();

        const message =
            String(data.message || "").trim();


        // =========================================================
        // VALIDATION
        // =========================================================

        if (
            !name ||
            !email ||
            !phone ||
            !enquiryType ||
            !subject ||
            !message
        ) {

            return {

                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    success: false,

                    message:
                        "Please complete all required fields."

                })

            };

        }


        // =========================================================
        // BASIC EMAIL VALIDATION
        // =========================================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            return {

                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    success: false,

                    message:
                        "Please enter a valid email address."

                })

            };

        }


        // =========================================================
        // GET BITRIX24 WEBHOOK
        // =========================================================

        const bitrixWebhookUrl =
            process.env.BITRIX_WEBHOOK_URL;


        if (!bitrixWebhookUrl) {

            console.error(
                "BITRIX_WEBHOOK_URL is not configured."
            );


            return {

                statusCode: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    success: false,

                    message:
                        "Bitrix24 connection is not configured."

                })

            };

        }


        // =========================================================
        // CLEAN WEBHOOK URL
        // =========================================================

        const webhook =
            bitrixWebhookUrl.endsWith("/")
                ? bitrixWebhookUrl
                : bitrixWebhookUrl + "/";


        // =========================================================
        // CREATE BITRIX24 LEAD
        // =========================================================

        const bitrixResponse =
            await fetch(
                webhook + "crm.lead.add.json",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        fields: {

                            // ---------------------------------
                            // TITLE
                            // ---------------------------------

                            TITLE:
                                "Smart Appliances Enquiry - " +
                                subject,


                            // ---------------------------------
                            // CUSTOMER NAME
                            // ---------------------------------

                            NAME:
                                name,


                            // ---------------------------------
                            // EMAIL
                            // ---------------------------------

                            EMAIL: [

                                {
                                    VALUE:
                                        email,

                                    VALUE_TYPE:
                                        "WORK"
                                }

                            ],


                            // ---------------------------------
                            // PHONE
                            // ---------------------------------

                            PHONE: [

                                {
                                    VALUE:
                                        phone,

                                    VALUE_TYPE:
                                        "WORK"
                                }

                            ],


                            // ---------------------------------
                            // COMMENTS
                            // ---------------------------------

                            COMMENTS:

                                "Dinges TechHub Website Enquiry\n\n" +

                                "Service: " +
                                (service ||
                                    "Smart Appliances & Devices") +

                                "\n\nEnquiry Type: " +
                                enquiryType +

                                "\n\nSubject: " +
                                subject +

                                "\n\nMessage:\n" +
                                message +

                                "\n\nSource: " +
                                (source ||
                                    "Website"),


                            // ---------------------------------
                            // SOURCE
                            // ---------------------------------

                            SOURCE_DESCRIPTION:
                                source ||
                                "Dinges TechHub Website"


                        }

                    })

                }
            );


        // =========================================================
        // READ BITRIX RESPONSE
        // =========================================================

        const result =
            await bitrixResponse.json();


        // =========================================================
        // CHECK BITRIX RESPONSE
        // =========================================================

        if (
            !bitrixResponse.ok ||
            result.error
        ) {

            console.error(
                "Bitrix24 Error:",
                result
            );


            return {

                statusCode: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    success: false,

                    message:
                        "Unable to send your enquiry to Bitrix24."

                })

            };

        }


        // =========================================================
        // SUCCESS
        // =========================================================

        console.log(
            "Bitrix24 Lead Created:",
            result.result
        );


        return {

            statusCode: 200,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                success: true,

                message:
                    "Thank you. Your enquiry has been received successfully."

            })

        };


    } catch (error) {

        // =========================================================
        // SERVER ERROR
        // =========================================================

        console.error(
            "Bitrix24 Function Error:",
            error
        );


        return {

            statusCode: 500,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                success: false,

                message:
                    "Something went wrong while processing your enquiry."

            })

        };

    }

};
