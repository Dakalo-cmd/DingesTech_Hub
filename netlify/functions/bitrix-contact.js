exports.handler = async function (event) {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {

        return {
            statusCode: 405,
            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };

    }


    try {

        // Get form data from the website
        const data = JSON.parse(event.body);


        // Get the information sent by the contact form
        const name = data.name || "";
        const email = data.email || "";
        const phone = data.phone || "";
        const subject = data.subject || "";
        const message = data.message || "";


        // Check required fields
        if (!name || !email || !subject || !message) {

            return {
                statusCode: 400,

                body: JSON.stringify({
                    success: false,
                    message: "Please complete all required fields."
                })
            };

        }


        /*
        =========================================================
        BITRIX24 CONNECTION
        We will add your Bitrix24 webhook URL here later.
        =========================================================
        */

        const bitrixWebhookUrl =
            process.env.BITRIX_WEBHOOK_URL;


        // Send information to Bitrix24
        const response = await fetch(
            bitrixWebhookUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    fields: {

                        TITLE:
                            "Website Enquiry - " + subject,

                        NAME:
                            name,

                        EMAIL: [
                            {
                                VALUE: email,
                                VALUE_TYPE: "WORK"
                            }
                        ],

                        PHONE: phone
                            ? [
                                {
                                    VALUE: phone,
                                    VALUE_TYPE: "WORK"
                                }
                            ]
                            : [],

                        COMMENTS:
                            "Subject: " +
                            subject +
                            "\n\nMessage:\n" +
                            message,

                        SOURCE_DESCRIPTION:
                            "Dinges TechHub Website Contact Form"

                    }

                })

            }
        );


        const result =
            await response.json();


        // Check if Bitrix24 accepted the enquiry
        if (!response.ok) {

            console.error(
                "Bitrix24 Error:",
                result
            );


            return {

                statusCode: 500,

                body: JSON.stringify({

                    success: false,

                    message:
                        "Unable to send your message to Bitrix24."

                })

            };

        }


        // Success
        return {

            statusCode: 200,

            body: JSON.stringify({

                success: true,

                message:
                    "Your message has been sent successfully."

            })

        };


    } catch (error) {

        console.error(
            "Server Error:",
            error
        );


        return {

            statusCode: 500,

            body: JSON.stringify({

                success: false,

                message:
                    "Something went wrong. Please try again later."

            })

        };

    }

};
