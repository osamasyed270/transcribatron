import { DEBUG_MODE } from "@/utils/Constant";
import http from "@/utils/Http";

const EMAIL_API = "http://localhost:8082/api/v1/email";

const _get = (url) => {
    return http
        .get(EMAIL_API + url)
        .then((res) => {
                return res;
            },
            (err) => {
                // if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const _post = (url, payload) => {
    return http
        .post(EMAIL_API + url, { ...payload })
        .then(
            (res) => {
                return res;
            },
            (err) => {
                // if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const _put = (url, payload) => {
    return http
        .put(EMAIL_API + url, { ...payload })
        .then(
            (res) => {
                return res;
            },
            (err) => {
                // if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const _delete = (url, payload) => {
    return http
        .delete(EMAIL_API + url, { ...payload })
        .then(
            (res) => {
                return res;
            },
            (err) => {
                // if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const sendEmail = (payload) => _post("/outbound", payload);
const searchEmails = (payload) => _post("/search", payload);
const getAllEmails = () => _get("/listAll");
const sendEmailFromTemplate = (payload) => _post("/outbound/template", payload);
const listAllEmailsFromDate = (folderName, from) => _get(`/list/${folderName}/${from}`);
const retrieveAllEmailsInFolder = (folderName) => _get(`/folder/${folderName}`);
const retrieveAllEmails = () => _get("/inbound");
const getEmailById = (uuid) => _get(`/inbound/${uuid}`);
const retrieveAllEmailsDrafts = () => _get("/draft");
const retrieveEmailDraftById = (draftId) => _get(`/draft/${draftId}`);
const createEmailDraft = (payload) => _put("/draft", payload);
const updateEmailDraft = (payload) => _post("/draft", payload);
const deleteEmailDraft = (payload) => _delete("/draft", payload);
const addLabel = (payload) => _post("/addLabel", payload);
const removeLabel = (payload) => _post("/removeLabel", payload);
const addTag = (payload) => _post("/addTag", payload);
const removeTag = (payload) => _post("/removeTag", payload);
const moveEmails = (payload) => _post("/move", payload);
const deleteEmail = (payload) => _post("/delete", payload);
const deleteAllEmailsInFolder = (folderName, payload) => _delete(`/folder/${folderName}`, payload);


const EmailService = {
     sendEmail,
     searchEmails,
     getAllEmails,
     sendEmailFromTemplate,
     listAllEmailsFromDate,
     retrieveAllEmailsInFolder,
     deleteAllEmailsInFolder,
     retrieveAllEmails,
     getEmailById,
     retrieveAllEmailsDrafts,
     retrieveEmailDraftById,
     createEmailDraft,
     updateEmailDraft,
     deleteEmailDraft,
     addLabel,
     removeLabel,
     addTag,
     removeTag,
     moveEmails,
     deleteEmail
};

export default EmailService;