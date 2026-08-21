/**
 * ============================================================
 * DINGES TECHHUB
 * BITRIX24 CONTACT / ENQUIRY FUNCTION
 * ============================================================
 *
 * Netlify Function:
 *
 * /.netlify/functions/bitrix-contact
 *
 * Required Netlify environment variable:
 *
 * B24_HOOK
 *
 * Example:
 *
 * https://your-company.bitrix24.com/rest/1/YOUR_WEBHOOK_TOKEN/
 *
 * IMPORTANT:
 * Never put the Bitrix24 webhook directly inside the
 * HTML/JavaScript frontend.
 * ============================================================
 */

exports.handler = async (event) => {

    console.log("========================================");
    console.log("Dinges TechHub - bitrix-contact started");
    console.log("HTTP Method:", event.httpMethod);
    console.log("========================================");


    /* ========================================================
       CORS
       ======================================================== */

    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
    };


    /* ========================================================
       HELPER: JSON RESPONSE
       ======================================================== */

    const response = (statusCode, data) => {

        return {
            statusCode,
            headers,
            body: JSON.stringify(data)
        };

    };


    /* ========================================================
       OPTIONS REQUEST
       ======================================================== */

    if (event.httpMethod === "OPTIONS") {

        return response(
            204,
            {
                success: true
            }
        );

    }


    /* ========================================================
       ONLY POST ALLOWED
       ======================================================== */

    if (event.httpMethod !== "POST") {

        console.error(
            "Rejected request. Method:",
            event.httpMethod
        );

        return response(
            405,
            {
                success: false,
                message:
                    "Method not allowed. Please submit the enquiry using POST."
            }
        );

    }


    /* ========================================================
       BITRIX WEBHOOK
       ======================================================== */

    const rawHook =
        process.env.B24_HOOK ||
        process.env.BITRIX_WEBHOOK_URL ||
        process.env.BITRIX24_WEBHOOK_URL ||
        "";


    if (!rawHook) {

        console.error(
            "Bitrix24 webhook environment variable is missing."
        );

        return response(
            500,
            {
                success: false,
                message:
                    "Bitrix24 is not configured on the server. Please contact the website administrator."
            }
        );

    }


    /*
     * Remove accidental whitespace and trailing slash.
     */

    const bitrixHook =
        rawHook.trim().replace(/\/+$/, "");


    console.log(
        "Bitrix webhook configured:",
        bitrixHook
            .replace(/\/rest\/.*$/i, "/rest/***")
    );


    /* ========================================================
       READ REQUEST BODY
       ======================================================== */

    let body;


    try {

        if (!event.body) {

            throw new Error(
                "Request body is empty."
            );

        }


        /*
         * Netlify normally gives us the body as a string.
         * Handle base64 just in case.
         */

        const bodyText =
            event.isBase64Encoded
                ? Buffer
                    .from(
                        event.body,
                        "base64"
                    )
                    .toString("utf8")
                : event.body;


        body =
            JSON.parse(bodyText);


    } catch (error) {

        console.error(
            "Invalid JSON received:",
            error.message
        );


        return response(
            400,
            {
                success: false,
                message:
                    "Invalid enquiry data was received."
            }
        );

    }


    /* ========================================================
       READ FORM VALUES
       ======================================================== */

    const name =
        clean(body.name);

    const email =
        clean(body.email);

    const phone =
        clean(body.phone);

    const service =
        clean(body.service) ||
        "Automation Software";

    const source =
        clean(body.source) ||
        "Dinges TechHub - Automation Software";

    const enquiryType =
        clean(body.enquiry_type);

    const subject =
        clean(body.subject);

    const message =
        clean(body.message);


    console.log(
        "Enquiry received:",
        {
            name,
            email,
            phone,
            service,
            enquiryType,
            subject
        }
    );


    /* ========================================================
       SERVER-SIDE VALIDATION
       ======================================================== */

    if (!name) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please provide your full name."
            }
        );

    }


    if (!email) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please provide your email address."
            }
        );

    }


    if (!isValidEmail(email)) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please provide a valid email address."
            }
        );

    }


    if (!phone) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please provide your phone number."
            }
        );

    }


    if (!enquiryType) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please select an enquiry type."
            }
        );

    }


    if (!subject) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please provide a subject."
            }
        );

    }


    if (!message) {

        return response(
            400,
            {
                success: false,
                message:
                    "Please describe your automation requirements."
            }
        );

    }


    /* ========================================================
       CREATE BITRIX LEAD TITLE
       ======================================================== */

    const leadTitle =
        `${service} - ${subject}`;


    /* ========================================================
       SPLIT FULL NAME
       ======================================================== */

    const nameParts =
        name
            .split(/\s+/)
            .filter(Boolean);


    const firstName =
        nameParts.shift() ||
        name;


    const lastName =
        nameParts.join(" ");


    /* ========================================================
       CREATE COMMENTS
       ======================================================== */

    const comments = [

        "DINGES TECHHUB WEBSITE ENQUIRY",

        "",

        `Service: ${service}`,

        `Enquiry Type: ${enquiryType}`,

        `Source: ${source}`,

        `Subject: ${subject}`,

        "",

        "Customer Requirements:",

        message,

        "",

        "Submitted through Dinges TechHub Automation Software page."

    ].join("\n");


    /* ========================================================
       BITRIX24 CRM ITEM
       ========================================================
       
       entityTypeId 1 = Lead

       Current Bitrix24 documentation recommends crm.item.add
       for new lead integrations.
       ======================================================== */

    const bitrixPayload = {

        entityTypeId: 1,

        fields: {

            title:
                leadTitle,

            name:
                firstName,

            lastName:
                lastName,

            fm: [

                {
                    VALUE_TYPE: "PHONE",
                    VALUE: phone,
                    TYPE_ID: "PHONE"
                },

                {
                    VALUE_TYPE: "EMAIL",
                    VALUE: email,
                    TYPE_ID: "EMAIL"
                }

            ],

            sourceId:
                "WEB",

            sourceDescription:
                source,

            comments:
                comments,

            opened:
                "Y"

        }

    };


    /* ========================================================
       BITRIX24 API URL
       ======================================================== */

    const bitrixUrl =
        `${bitrixHook}/crm.item.add.json`;


    console.log(
        "Sending enquiry to Bitrix24..."
    );


    /* ========================================================
       SEND TO BITRIX24
       ======================================================== */

    let bitrixResponse;


    try {

        bitrixResponse =
            await fetch(
                bitrixUrl,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            bitrixPayload
                        )

                }
            );


    } catch (error) {

        console.error(
            "Could not connect to Bitrix24:",
            error
        );


        return response(
            502,
            {
                success: false,
                message:
                    "We could not connect to Bitrix24. Please try again shortly."
            }
        );

    }


    /* ========================================================
       READ BITRIX RESPONSE
       ======================================================== */

    const bitrixText =
        await bitrixResponse.text();


    console.log(
        "Bitrix24 HTTP status:",
        bitrixResponse.status
    );


    let bitrixData;


    try {

        bitrixData =
            JSON.parse(
                bitrixText
            );

    } catch (error) {

        console.error(
            "Bitrix24 returned invalid JSON:",
            bitrixText
        );


        return response(
            502,
            {
                success: false,
                message:
                    "Bitrix24 returned an invalid response. Please try again later."
            }
        );

    }


    /* ========================================================
       BITRIX ERROR
       ======================================================== */

    if (
        !bitrixResponse.ok ||
        bitrixData.error
    ) {

        console.error(
            "Bitrix24 API error:",
            {
                httpStatus:
                    bitrixResponse.status,

                error:
                    bitrixData.error,

                description:
                    bitrixData.error_description
            }
        );


        /*
         * Do NOT expose the webhook URL or token.
         *
         * Return a useful but safe message to the frontend.
         */

        let safeMessage =
            "Bitrix24 could not create the enquiry.";


        if (
            bitrixData.error_description
        ) {

            safeMessage =
                bitrixData.error_description;

        } else if (
            bitrixData.error
        ) {

            safeMessage =
                `Bitrix24 error: ${bitrixData.error}`;

        }


        return response(
            502,
            {
                success: false,
                message:
                    safeMessage
            }
        );

    }


    /* ========================================================
       GET CREATED LEAD ID
       ======================================================== */

    const leadId =
        bitrixData.result &&
        (
            bitrixData.result.item ||
            bitrixData.result.id
        );


    console.log(
        "Bitrix24 enquiry created successfully.",
        "Lead ID:",
        leadId || "unknown"
    );


    /* ========================================================
       SUCCESS
       ======================================================== */

    return response(
        200,
        {
            success: true,

            message:
                "Your enquiry was successfully sent to Dinges TechHub.",

            id:
                leadId || null
        }
    );

};


/* ============================================================
   CLEAN VALUE
   ============================================================ */

function clean(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim()
        .replace(/\u0000/g, "");

}


/* ============================================================
   EMAIL VALIDATION
   ============================================================ */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}
