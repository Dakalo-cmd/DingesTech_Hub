exports.handler = async (event) => {
    console.log("bitrix-contact function started");
    console.log("HTTP Method:", event.httpMethod);

    // =========================================================
    // ONLY ALLOW POST
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

        // =====================================================
        // CHECK REQUEST BODY
        // =====================================================

        if (!event.body) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "No enquiry data was received."
                })
            };
        }

        // =====================================================
        // PARSE JSON
        // =====================================================

        let data;

        try {
            data = JSON.parse(event.body);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);

            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Invalid request data."
                })
            };
        }

        // =====================================================
        // READ FORM DATA
        // =====================================================

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

        // =====================================================
        // VALIDATION
        // =====================================================

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
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Please complete all required fields."
                })
            };
        }

        // =====================================================
        // EMAIL VALIDATION
        // =====================================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Please enter a valid email address."
                })
            };
        }

        // =====================================================
        // GET BITRIX WEBHOOK
        // =====================================================

        const bitrixWebhookUrl =
            process.env.BITRIX_WEBHOOK_URL;

        if (!bitrixWebhookUrl) {

            console.error(
                "ERROR: BITRIX_WEBHOOK_URL environment variable is missing."
            );

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Bitrix24 connection is not configured."
                })
            };
        }

        // =====================================================
        // CLEAN WEBHOOK URL
        // =====================================================

        const webhook =
            bitrixWebhookUrl.endsWith("/")
                ? bitrixWebhookUrl
                : bitrixWebhookUrl + "/";

        console.log("Bitrix webhook configured:", true);

        // =====================================================
        // CREATE BITRIX LEAD
        // =====================================================

        const bitrixResponse = await fetch(
            webhook + "crm.lead.add.json",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({
                    fields: {

                        TITLE:
                            "Dinges TechHub Enquiry - " +
                            subject,

                        NAME:
                            name,

                        EMAIL: [
                            {
                                VALUE: email,
                                VALUE_TYPE: "WORK"
                            }
                        ],

                        PHONE: [
                            {
                                VALUE: phone,
                                VALUE_TYPE: "WORK"
                            }
                        ],

                        COMMENTS:
                            "DINGES TECHHUB WEBSITE ENQUIRY\n\n" +

                            "Customer Name: " +
                            name +

                            "\nEmail: " +
                            email +

                            "\nPhone: " +
                            phone +

                            "\nService: " +
                            (service || "Not specified") +

                            "\nEnquiry Type: " +
                            enquiryType +

                            "\nSubject: " +
                            subject +

                            "\n\nMessage:\n" +
                            message +

                            "\n\nSource: " +
                            (source || "Dinges TechHub Website"),

                        SOURCE_DESCRIPTION:
                            source ||
                            "Dinges TechHub Website"
                    }
                })
            }
        );

        // =====================================================
        // READ BITRIX RESPONSE SAFELY
        // =====================================================

        const responseText =
            await bitrixResponse.text();

        console.log(
            "Bitrix HTTP Status:",
            bitrixResponse.status
        );

        console.log(
            "Bitrix Response:",
            responseText
        );

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {

            console.error(
                "Bitrix returned non-JSON response:",
                responseText
            );

            return {
                statusCode: 502,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message:
                        "Bitrix24 returned an invalid response."
                })
            };
        }

        // =====================================================
        // CHECK BITRIX ERROR
        // =====================================================

        if (
            !bitrixResponse.ok ||
            result.error
        ) {

            console.error(
                "Bitrix24 API Error:",
                result
            );

            return {
                statusCode: 502,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message:
                        "Unable to send your enquiry to Bitrix24."
                })
            };
        }

        // =====================================================
        // SUCCESS
        // =====================================================

        console.log(
            "Bitrix24 Lead Created:",
            result.result
        );

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                message:
                    "Thank you. Your enquiry has been received successfully.",
                leadId:
                    result.result || null
            })
        };

    } catch (error) {

        console.error(
            "BITRIX CONTACT FUNCTION ERROR:",
            error
        );

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                message:
                    "Something went wrong while processing your enquiry."
            })
        };
    }
};
