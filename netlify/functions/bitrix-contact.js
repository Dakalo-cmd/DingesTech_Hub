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
        // GET FORM DATA
        // =========================================================

        const data =
            JSON.parse(event.body || "{}");


        // =========================================================
        // GET ALL CONTACT FORM FIELDS
        // =========================================================

        const name =
            (data.name || "").trim();

        const email =
            (data.email || "").trim();

        const phone =
            (data.phone || "").trim();

        const subject =
            (data.subject || "").trim();

        const reason =
            (data.reason || "").trim();

        const contactLocation =
            (data.contactLocation || "").trim();

        const message =
            (data.message || "").trim();


        // =========================================================
        // CHECK REQUIRED FIELDS
        // =========================================================

        if (
            !name ||
            !email ||
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
        // GET BITRIX24 WEBHOOK FROM NETLIFY ENVIRONMENT VARIABLE
        // =========================================================

        const bitrixWebhookUrl =
            process.env.BITRIX_WEBHOOK_URL;


        // Check if webhook exists
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
        // CREATE BITRIX24 CRM LEAD
        // =========================================================

        const bitrixResponse =
            await fetch(
                bitrixWebhookUrl + "crm.lead.add.json",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        fields: {

                            // ---------------------------------
                            // LEAD TITLE
                            // ---------------------------------

                            TITLE:
                                "Website Enquiry - " +
                                subject,


                            // ---------------------------------
                            // CUSTOMER NAME
                            // ---------------------------------

                            NAME:
                                name,


                            // ---------------------------------
                            // CUSTOMER EMAIL
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
                            // CUSTOMER PHONE
                            // ---------------------------------

                            PHONE:
                                phone
                                    ? [

                                        {

                                            VALUE:
                                                phone,

                                            VALUE_TYPE:
                                                "WORK"

                                        }

                                    ]

                                    : [],


                            // ---------------------------------
                            // LEAD COMMENTS
                            // ---------------------------------

                            COMMENTS:

                                "Dinges TechHub Website Contact Form\n\n" +

                                "Subject: " +
                                subject +

                                "\n\nReason for Contact: " +
                                (reason || "Not specified") +

                                "\n\nLocation / Address: " +
                                (contactLocation || "Not specified") +

                                "\n\nMessage:\n" +
                                message,


                            // ---------------------------------
                            // LEAD SOURCE
                            // ---------------------------------

                            SOURCE_DESCRIPTION:
                                "Dinges TechHub Website Contact Form"

                        }

                    })

                }
            );


        // =========================================================
        // GET BITRIX24 RESPONSE
        // =========================================================

        const result =
            await bitrixResponse.json();


        // =========================================================
        // CHECK BITRIX24 RESPONSE
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
                        "Unable to send your message to Bitrix24."

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
                    "Your message has been sent successfully."

            })

        };


    } catch (error) {


        // =========================================================
        // ERROR HANDLING
        // =========================================================

        console.error(
            "Server Error:",
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
                    "Something went wrong. Please try again later."

            })

        };

    }

};
