import { DEBUG_MODE } from "@/utils/Constant";
import http from "@/utils/Http";

const BASE_URL = "http://localhost:8082/api/v1/admin";

const _get = (url) => {
    return http
        .get(BASE_URL + url)
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
        .post(BASE_URL + url, { ...payload })
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
        .put(BASE_URL + url, { ...payload })
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
        .delete(BASE_URL + url, { ...payload })
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

const listAllUsers = () => _get("/user");
const getUserById = (userId) => _get(`/user/${userId}`);
const getUserAlias = (userId) => _get(`/user/${userId}/alias`);
const addUserAlias = (userId, payload) => _post(`/user/${userId}/alias`, payload);
const removeUserAlias = (userId, payload) => _delete(`/user/${userId}/alias`, payload);
const createUser = (payload) => _put("/user", payload);
const updateUser = (payload) => _post("/user", payload);
const deleteUser = (payload) => _delete("/user", payload);

const listAllGroups = () => _get("/group");
const getGroupById = (groupId) => _get(`/group/${groupId}`);
const getGroupAlias = (groupId) => _get(`/group/${groupId}/alias`);
const addGroupAlias = (groupId, payload) => _post(`/group/${groupId}/alias`, payload);
const removeGroupAlias = (groupId, payload) => _delete(`/group/${groupId}/alias`, payload);
const getGroupMembers = (groupId) => _get(`/group/${groupId}/members`);
const createGroup = (payload) => _put("/group", payload);
const updateGroup = (payload) => _post("/group", payload);
const addToGroup = (payload) => _post("/group/add", payload);
const removeFromGroup = (payload) => _post("/group/remove", payload);
const deleteGroup = (payload) => _delete("/group", payload);

const listAllContacts = () => _get("/contact");
const getContactById = (contactId) => _get(`/contact/${contactId}`);
const createContact = (payload) => _put("/contact", payload);
const updateContact = (payload) => _post("/contact", payload);
const deleteContact = (payload) => _delete("/contact", payload);

const listAllLabels = () => _get("/label");
const getLabelById = (labelId) => _get(`/label/${labelId}`);
const createLabel = (payload) => _put("/label", payload);
const updateLabel = (payload) => _post("/label", payload);
const deleteLabel = (payload) => _delete("/label", payload);

const EmailAdminService = {
        listAllUsers,
        getUserById,
        getUserAlias,
        addUserAlias,
        removeUserAlias,
        createUser,
        updateUser,
        deleteUser,

        listAllGroups,
        getGroupById,
        getGroupAlias,
        addGroupAlias,
        removeGroupAlias,
        getGroupMembers,
        createGroup,
        updateGroup,
        addToGroup,
        removeFromGroup,
        deleteGroup,

        listAllContacts,
        getContactById,
        createContact,
        updateContact,
        deleteContact,

        listAllLabels,
        getLabelById,
        createLabel,
        updateLabel,
        deleteLabel
};

export default EmailAdminService;