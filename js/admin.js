/* =========================================
   PLUTONIUM VAULT — ADMIN PANEL
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const status = document.getElementById("admin-status");
    const dashboard = document.getElementById("admin-dashboard");
    const adminUsername =
        document.getElementById("admin-username");

    if (!status || !dashboard) {
        return;
    }

    /* -----------------------------------------
       CHECK LOGIN
    ----------------------------------------- */

    const {
        data: {
            user
        },
        error: userError
    } = await vaultSupabase.auth.getUser();

    if (userError || !user) {

        status.textContent =
            "ACCESS DENIED — PLEASE LOG IN";

        return;
    }

    /* -----------------------------------------
       CHECK ADMIN ROLE
    ----------------------------------------- */

    const {
        data: isAdmin,
        error: adminError
    } = await vaultSupabase.rpc(
        "is_admin"
    );

    if (adminError) {

        console.error(
            "Admin check failed:",
            adminError
        );

        status.textContent =
            "UNABLE TO VERIFY ADMIN ACCESS";

        return;
    }

    /* -----------------------------------------
       NOT AN ADMIN
    ----------------------------------------- */

    if (!isAdmin) {

        status.textContent =
            "ACCESS DENIED";

        return;
    }

    /* -----------------------------------------
       ADMIN ACCESS GRANTED
    ----------------------------------------- */

    status.textContent =
        "ADMIN ACCESS GRANTED";

    dashboard.style.display =
        "block";

    /* -----------------------------------------
       LOAD ADMIN USERNAME
    ----------------------------------------- */

    const {
        data: profile,
        error: profileError
    } = await vaultSupabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (!profileError && profile) {

        adminUsername.textContent =
            profile.username;
    }
 

});

/* =========================================
   ADMIN USERS
========================================= */

const adminUsersButton =
    document.getElementById("admin-users-button");

const adminUsersPanel =
    document.getElementById("admin-users-panel");

const adminUsersList =
    document.getElementById("admin-users-list");

const adminUserSearch =
    document.getElementById("admin-user-search");

const adminUserFilter =
    document.getElementById("admin-user-filter");    


async function loadAdminUsers() {

    if (!adminUsersList) {
        return;
    }

    adminUsersList.innerHTML =
        `<p class="admin-loading">LOADING USERS...</p>`;

    const {
        data: users,
        error
    } = await vaultSupabase
        .from("profiles")
        .select(`
            id,
            username,
            avatar_url,
            role,
            is_banned,
            ban_reason,
            banned_until,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Unable to load users:",
            error
        );

        adminUsersList.innerHTML =
            `<p class="admin-loading">
                UNABLE TO LOAD USERS
            </p>`;

        return;
    }

    renderAdminUsers(users || []);
}


function renderAdminUsers(users) {

    if (!adminUsersList) {
        return;
    }

    if (users.length === 0) {

        adminUsersList.innerHTML =
            `<p class="admin-loading">
                NO USERS FOUND
            </p>`;

        return;
    }

    adminUsersList.innerHTML =
        users.map(user => {

            const joinDate =
                new Date(user.created_at)
                    .toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    )
                    .toUpperCase();

            const role =
                user.role === "admin"
                    ? "ADMIN"
                    : "USER";

            const banStatus =
                user.is_banned
                    ? "BANNED"
                    : "ACTIVE";

            return `
                <div
    class="admin-user-row"
    data-username="${(
        user.username || ""
    ).toLowerCase()}"
    data-role="${user.role === "admin" ? "admin" : "user"}"
    data-status="${user.is_banned ? "banned" : "active"}"
>

                    <div class="admin-user-info">

                        <div class="admin-user-avatar">

                            ${
                                user.avatar_url
                                    ? `
                                        <img
                                            src="${user.avatar_url}"
                                            alt=""
                                        >
                                      `
                                    : `
                                        <span>
                                            ${
                                                (
                                                    user.username ||
                                                    "?"
                                                )
                                                .charAt(0)
                                                .toUpperCase()
                                            }
                                        </span>
                                      `
                            }

                        </div>

                        <div>

                            <strong>
                                ${
                                    user.username ||
                                    "UNKNOWN"
                                }
                            </strong>

                            <small>
                                JOINED ${joinDate}
                            </small>

                        </div>

                    </div>

                    <div class="admin-user-meta">

                        <span
                            class="admin-user-role"
                        >
                            ${role}
                        </span>

                        <span
                            class="admin-user-status ${
                                user.is_banned
                                    ? "banned"
                                    : ""
                            }"
                        >
                            ${banStatus}
                        </span>

                    </div>

                    <button
                        type="button"
                        class="admin-manage-user"
                        data-user-id="${user.id}"
                    >
                        MANAGE
                    </button>

                </div>
            `;

        }).join("");
}


/* ---------- OPEN USERS ---------- */

adminUsersButton?.addEventListener(
    "click",
    async () => {

        if (!adminUsersPanel) {
            return;
        }

        adminUsersPanel.style.display =
            "block";

        await loadAdminUsers();
        await loadAdminUserStats();
        await loadAdminSubmissionStats();

        adminUsersPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* ---------- SEARCH + FILTER USERS ---------- */

function filterAdminUsers() {

    const search =
        adminUserSearch?.value
            .trim()
            .toLowerCase() || "";

    const filter =
        adminUserFilter?.value || "all";

    const rows =
        adminUsersList?.querySelectorAll(
            ".admin-user-row"
        ) || [];

    rows.forEach(row => {

        const username =
            row.dataset.username || "";

        const role =
            row.dataset.role || "user";

        const status =
            row.dataset.status || "active";

        const matchesSearch =
            username.includes(search);

        const matchesFilter =
            filter === "all" ||
            filter === role ||
            filter === status;

        row.style.display =
            matchesSearch && matchesFilter
                ? ""
                : "none";

    });
}


adminUserSearch?.addEventListener(
    "input",
    filterAdminUsers
);

adminUserFilter?.addEventListener(
    "change",
    filterAdminUsers
);

/* =========================================
   ADMIN USER MANAGEMENT
========================================= */

let selectedAdminUser = null;

const adminUserModal =
    document.getElementById("admin-user-modal");

const adminUserModalClose =
    document.getElementById("admin-user-modal-close");

const manageUserName =
    document.getElementById("manage-user-name");

const manageUserRole =
    document.getElementById("manage-user-role");

const manageUserStatus =
    document.getElementById("manage-user-status");

const adminBanUser =
    document.getElementById("admin-ban-user");

const adminUnbanUser =
    document.getElementById("admin-unban-user");

const adminBanFields =
    document.getElementById("admin-ban-fields");

const adminBanReason =
    document.getElementById("admin-ban-reason");

const adminBanUntil =
    document.getElementById("admin-ban-until");

const adminBanInfo =
    document.getElementById("admin-ban-info");

const manageBanReason =
    document.getElementById("manage-ban-reason");

const manageBanUntil =
    document.getElementById("manage-ban-until");


/* ---------- OPEN USER ---------- */

adminUsersList?.addEventListener(
    "click",
    event => {

        const manageButton =
            event.target.closest(
                ".admin-manage-user"
            );

        if (!manageButton) {
            return;
        }

        const userId =
            manageButton.dataset.userId;

        openAdminUserManager(userId);
    }
);


/* ---------- LOAD USER ---------- */

async function openAdminUserManager(userId) {

    const {
        data: user,
        error
    } = await vaultSupabase
        .from("profiles")
        .select(`
            id,
            username,
            role,
            is_banned,
            ban_reason,
            banned_until
        `)
        .eq("id", userId)
        .single();

    if (error || !user) {

        console.error(
            "Unable to load user:",
            error
        );

        return;
    }

    selectedAdminUser = user;

    manageUserName.textContent =
        user.username || "UNKNOWN";

    manageUserRole.textContent =
        user.role === "admin"
            ? "ADMIN"
            : "USER";

    manageUserStatus.textContent =
        user.is_banned
            ? "BANNED"
            : "ACTIVE";

    if (user.is_banned) {

    adminBanInfo.style.display =
        "block";

    manageBanReason.textContent =
        user.ban_reason || "NO REASON PROVIDED";

    if (user.banned_until) {

        manageBanUntil.textContent =
            new Date(
                user.banned_until
            ).toLocaleString(
                "en-GB",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

    } else {

        manageBanUntil.textContent =
            "PERMANENT";

    }

} else {

    adminBanInfo.style.display =
        "none";

}        

    adminBanReason.value =
        user.ban_reason || "";

    if (user.banned_until) {

        const date =
            new Date(user.banned_until);

        const localDate =
            new Date(
                date.getTime() -
                date.getTimezoneOffset() * 60000
            );

        adminBanUntil.value =
            localDate
                .toISOString()
                .slice(0, 16);

    } else {

        adminBanUntil.value = "";
    }

    adminBanFields.style.display =
        user.is_banned
            ? "none"
            : "block";

    adminBanUser.style.display =
        user.is_banned
            ? "none"
            : "inline-block";

    adminUnbanUser.style.display =
        user.is_banned
            ? "inline-block"
            : "none";

    adminUserModal.style.display =
        "flex";
}


/* ---------- CLOSE ---------- */

adminUserModalClose?.addEventListener(
    "click",
    closeAdminUserManager
);


adminUserModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            adminUserModal
        ) {
            closeAdminUserManager();
        }

    }
);


function closeAdminUserManager() {

    if (!adminUserModal) {
        return;
    }

    adminUserModal.style.display =
        "none";

    selectedAdminUser = null;
}

/* =========================================
   BAN / UNBAN ACTIONS
========================================= */

const adminConfirmBan =
    document.getElementById("admin-confirm-ban");


/* ---------- BAN USER ---------- */

adminConfirmBan?.addEventListener(
    "click",
    async () => {

        if (!selectedAdminUser) {
            return;
        }

        const reason =
            adminBanReason.value.trim();

        const bannedUntil =
            adminBanUntil.value
                ? new Date(
                    adminBanUntil.value
                  ).toISOString()
                : null;

        if (!reason) {
            alert("Please enter a ban reason.");
            return;
        }

        adminConfirmBan.disabled = true;
        adminConfirmBan.textContent =
            "BANNING...";

        const {
            data,
            error
        } = await vaultSupabase.rpc(
            "ban_user",
            {
                target_user_id:
                    selectedAdminUser.id,

                ban_reason_input:
                    reason,

                ban_until_input:
                    bannedUntil
            }
        );

        if (error) {

            console.error(
                "Ban failed:",
                error
            );

            alert(
                error.message ||
                "Unable to ban user."
            );

            adminConfirmBan.disabled = false;
            adminConfirmBan.textContent =
                "CONFIRM BAN";

            return;
        }

        await writeAdminAuditLog({
    action: "banned",
    targetType: "user",
    targetId: selectedAdminUser.id,
    targetName:
        selectedAdminUser.username ||
        "Unknown user",
    details: {
        reason,
        banned_until:
            bannedUntil
    }
});

        console.log(
            "User banned:",
            data
        );

        closeAdminUserManager();

await loadAdminUsers();
await loadAdminUserStats();

    }
);


/* ---------- UNBAN USER ---------- */

adminUnbanUser?.addEventListener(
    "click",
    async () => {

        if (!selectedAdminUser) {
            return;
        }

        adminUnbanUser.disabled = true;
        adminUnbanUser.textContent =
            "UNBANNING...";

        const {
            data,
            error
        } = await vaultSupabase.rpc(
            "unban_user",
            {
                target_user_id:
                    selectedAdminUser.id
            }
        );

        if (error) {

            console.error(
                "Unban failed:",
                error
            );

            alert(
                error.message ||
                "Unable to unban user."
            );

            adminUnbanUser.disabled = false;
            adminUnbanUser.textContent =
                "UNBAN USER";

            return;
        }

        await writeAdminAuditLog({
    action: "unbanned",
    targetType: "user",
    targetId: selectedAdminUser.id,
    targetName:
        selectedAdminUser.username ||
        "Unknown user",
    details: {}
});

        console.log(
            "User unbanned:",
            data
        );

        closeAdminUserManager();

await loadAdminUsers();
await loadAdminUserStats();

    }
);

/* =========================================
   ADMIN DASHBOARD USER STATS
========================================= */

async function loadAdminUserStats() {

    const userCount =
        document.getElementById("user-count");

    const bannedCount =
        document.getElementById("banned-count");

    if (!userCount || !bannedCount) {
        return;
    }

    const {
        count: totalUsers,
        error: totalError
    } = await vaultSupabase
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true
        });

    if (totalError) {

        console.error(
            "Unable to load user count:",
            totalError
        );

        return;
    }

    const {
        count: totalBanned,
        error: bannedError
    } = await vaultSupabase
        .from("profiles")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("is_banned", true);

    if (bannedError) {

        console.error(
            "Unable to load banned count:",
            bannedError
        );

        return;
    }

    userCount.textContent =
        totalUsers || 0;

    bannedCount.textContent =
        totalBanned || 0;
}

/* =========================================
   ADMIN SUBMISSION STATS
========================================= */

async function loadAdminSubmissionStats() {

    const pendingCount =
        document.getElementById("pending-count");

    if (!pendingCount) {
        return;
    }

    const {
        count,
        error
    } = await vaultSupabase
        .from("submissions")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("status", "pending");

    if (error) {

        console.error(
            "Unable to load submission count:",
            error
        );

        pendingCount.textContent = "0";

        return;
    }

    pendingCount.textContent =
        count || 0;
}

/* =========================================
   ADMIN SUBMISSIONS
========================================= */

const adminSubmissionsButton =
    document.getElementById("admin-submissions-button");

const adminSubmissionsPanel =
    document.getElementById("admin-submissions-panel");

const adminSubmissionsList =
    document.getElementById("admin-submissions-list");

const adminSubmissionSearch =
    document.getElementById("admin-submission-search");

const adminSubmissionFilter =
    document.getElementById("admin-submission-filter");


let adminSubmissions = [];


/* ---------- LOAD SUBMISSIONS ---------- */

async function loadAdminSubmissions() {

    if (!adminSubmissionsList) {
        return;
    }

    adminSubmissionsList.innerHTML =
        `<p class="admin-loading">LOADING SUBMISSIONS...</p>`;

    const {
        data: submissions,
        error
    } = await vaultSupabase
        .from("submissions")
        .select(`
            id,
            user_id,
            title,
            type,
            description,
            preview_url,
            download_url,
            status,
            rejection_reason,
            created_at,
            updated_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Unable to load submissions:",
            error
        );

        adminSubmissionsList.innerHTML =
            `<p class="admin-loading">
                UNABLE TO LOAD SUBMISSIONS
            </p>`;

        return;
    }

    adminSubmissions =
        submissions || [];

    renderAdminSubmissions(
        adminSubmissions
    );
}


/* ---------- RENDER SUBMISSIONS ---------- */

function renderAdminSubmissions(submissions) {

    if (!adminSubmissionsList) {
        return;
    }

    if (submissions.length === 0) {

        adminSubmissionsList.innerHTML =
            `<p class="admin-loading">
                NO SUBMISSIONS FOUND
            </p>`;

        return;
    }

    adminSubmissionsList.innerHTML =
        submissions.map(submission => {

            const submittedDate =
                new Date(
                    submission.created_at
                )
                .toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )
                .toUpperCase();

            const status =
                submission.status || "pending";

            const type =
                submission.type === "calling-card"
                    ? "CALLING CARD"
                    : "EMBLEM";

            return `
                <div
                    class="admin-submission-row"
                    data-title="${(
                        submission.title || ""
                    ).toLowerCase()}"
                    data-status="${status}"
                >

                    <div class="admin-submission-preview">

                        ${
                            submission.preview_url
                                ? `
                                    <img
                                        src="${submission.preview_url}"
                                        alt=""
                                    >
                                `
                                : `
                                    <span>
                                        NO PREVIEW
                                    </span>
                                `
                        }

                    </div>

                    <div class="admin-submission-info">

                        <strong>
                            ${
                                submission.title ||
                                "UNTITLED SUBMISSION"
                            }
                        </strong>

                        <small>
                            ${type}
                            •
                            SUBMITTED ${submittedDate}
                        </small>

                        ${
                            submission.description
                                ? `
                                    <p>
                                        ${submission.description}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                    <div class="admin-submission-status ${status}">
                        ${status.toUpperCase()}
                    </div>

                  <div class="admin-submission-actions">

    <button
        type="button"
        class="admin-submission-view"
        data-submission-id="${submission.id}"
    >
        VIEW
    </button>

    <button
        type="button"
        class="admin-submission-approve"
        data-submission-id="${submission.id}"
    >
        APPROVE
    </button>

    <button
        type="button"
        class="admin-submission-reject"
        data-submission-id="${submission.id}"
    >
        REJECT
    </button>

</div> 

                </div>
            `;

        }).join("");
}


/* ---------- OPEN SUBMISSIONS ---------- */

adminSubmissionsButton?.addEventListener(
    "click",
    async () => {

        if (!adminSubmissionsPanel) {
            return;
        }

        adminSubmissionsPanel.style.display =
            "block";

        await loadAdminSubmissions();
        await loadAdminSubmissionStats();

        adminSubmissionsPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* ---------- SEARCH SUBMISSIONS ---------- */

function filterAdminSubmissions() {

    const search =
        adminSubmissionSearch?.value
            .trim()
            .toLowerCase() || "";

    const filter =
        adminSubmissionFilter?.value ||
        "all";

    const rows =
        adminSubmissionsList?.querySelectorAll(
            ".admin-submission-row"
        ) || [];

    rows.forEach(row => {

        const title =
            row.dataset.title || "";

        const status =
            row.dataset.status || "";

        const matchesSearch =
            title.includes(search);

        const matchesFilter =
            filter === "all" ||
            filter === status;

        row.style.display =
            matchesSearch && matchesFilter
                ? ""
                : "none";

    });
}


adminSubmissionSearch?.addEventListener(
    "input",
    filterAdminSubmissions
);

adminSubmissionFilter?.addEventListener(
    "change",
    filterAdminSubmissions
);

/* =========================================
   APPROVE / REJECT SUBMISSIONS
========================================= */

async function updateSubmissionStatus(
    submissionId,
    newStatus,
    rejectionReason = null
) {
    if (!submissionId) {
        return;
    }

    const updateData = {
        status: newStatus
    };

    if (newStatus === "rejected") {
        updateData.rejection_reason =
            rejectionReason || "No reason provided.";
    } else {
        updateData.rejection_reason = null;
    }

    const {
        error
    } = await vaultSupabase
        .from("submissions")
        .update(updateData)
        .eq("id", submissionId);

    if (error) {
        console.error(
            "Unable to update submission:",
            error
        );

        alert(
            "Unable to update submission.\n\n" +
            error.message
        );

        return;
    }

    const submission =
    adminSubmissions.find(
        item =>
            String(item.id) ===
            String(submissionId)
    );

await writeAdminAuditLog({
    action:
        newStatus === "approved"
            ? "approved"
            : "rejected",
    targetType:
        submission?.type || "submission",
    targetId:
        submissionId,
    targetName:
        submission?.title || "Unknown submission",
    details:
        newStatus === "rejected"
            ? {
                rejection_reason:
                    rejectionReason ||
                    "No reason provided."
            }
            : {}
});

    await loadAdminSubmissions();
    await loadAdminSubmissionStats();
    
    }
/* ---------- APPROVE FROM SUBMISSION LIST ---------- */

adminSubmissionsList?.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                ".admin-submission-approve"
            );

        if (!button) {
            return;
        }

        const submissionId =
            button.dataset.submissionId;

        const submission =
            adminSubmissions.find(
                item =>
                    String(item.id) ===
                    String(submissionId)
            );

        if (!submission) {
            return;
        }

        const confirmed =
            await showAdminDecisionModal(
                "approve"
            );

        if (!confirmed) {
            return;
        }

        button.disabled = true;
        button.textContent = "APPROVING...";

        await updateSubmissionStatus(
            submissionId,
            "approved"
        );
    }
);


/* ---------- REJECT FROM SUBMISSION LIST ---------- */

adminSubmissionsList?.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                ".admin-submission-reject"
            );

        if (!button) {
            return;
        }

        const submissionId =
            button.dataset.submissionId;

        const submission =
            adminSubmissions.find(
                item =>
                    String(item.id) ===
                    String(submissionId)
            );

        if (!submission) {
            return;
        }

        const reason =
            await showAdminDecisionModal(
                "reject"
            );

        if (!reason) {
            return;
        }

        button.disabled = true;
        button.textContent = "REJECTING...";

        await updateSubmissionStatus(
            submissionId,
            "rejected",
            reason
        );
    }
);


/* =========================================
   SUBMISSION VIEW MODAL
========================================= */

const adminSubmissionModal =
    document.getElementById("admin-submission-modal");

const adminSubmissionModalClose =
    document.getElementById(
        "admin-submission-modal-close"
    );

const adminSubmissionViewTitle =
    document.getElementById(
        "admin-submission-view-title"
    );

const adminSubmissionViewImage =
    document.getElementById(
        "admin-submission-view-image"
    );

const adminSubmissionViewType =
    document.getElementById(
        "admin-submission-view-type"
    );

const adminSubmissionViewStatus =
    document.getElementById(
        "admin-submission-view-status"
    );

const adminSubmissionViewDate =
    document.getElementById(
        "admin-submission-view-date"
    );

const adminSubmissionViewDescription =
    document.getElementById(
        "admin-submission-view-description-text"
    );

const adminSubmissionViewDownload =
    document.getElementById(
        "admin-submission-view-download"
    );


function openAdminSubmissionModal(submission) {

    if (!adminSubmissionModal || !submission) {
        return;
    }

    const submittedDate =
        submission.created_at
            ? new Date(
                submission.created_at
            ).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ).toUpperCase()
            : "UNKNOWN";

    const type =
        submission.type === "calling-card"
            ? "CALLING CARD"
            : "EMBLEM";

    const status =
        submission.status || "pending";

    adminSubmissionViewTitle.textContent =
        submission.title ||
        "UNTITLED SUBMISSION";

    adminSubmissionViewType.textContent =
        type;

    adminSubmissionViewStatus.textContent =
        status.toUpperCase();

        adminSubmissionViewStatus.className =
    `admin-submission-status-badge ${status}`;

    adminSubmissionViewDate.textContent =
        submittedDate;

    adminSubmissionViewDescription.textContent =
        submission.description ||
        "NO DESCRIPTION PROVIDED.";

    if (submission.preview_url) {

        adminSubmissionViewImage.src =
            submission.preview_url;

        adminSubmissionViewImage.style.display =
            "block";

    } else {

        adminSubmissionViewImage.removeAttribute(
            "src"
        );

        adminSubmissionViewImage.style.display =
            "none";
    }

    if (submission.download_url) {

        adminSubmissionViewDownload.href =
            submission.download_url;

        adminSubmissionViewDownload.style.display =
            "inline-block";

    } else {

        adminSubmissionViewDownload.removeAttribute(
            "href"
        );

        adminSubmissionViewDownload.style.display =
            "none";
    }

    


if (modalReasonBox) {
    const isRejected =
        status === "rejected";

    modalReasonBox.style.display =
        isRejected ? "block" : "none";

    if (isRejected && modalReasonText) {
        modalReasonText.textContent =
            submission.rejection_reason ||
            "NO REASON PROVIDED";
    }
}

    adminSubmissionModal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}


/* ---------- CLOSE MODAL ---------- */

function closeAdminSubmissionModal() {

    if (!adminSubmissionModal) {
        return;
    }

    adminSubmissionModal.style.display =
        "none";

    document.body.style.overflow =
        "";
}


adminSubmissionModalClose?.addEventListener(
    "click",
    closeAdminSubmissionModal
);


/* ---------- CLOSE WHEN CLICKING OUTSIDE ---------- */

adminSubmissionModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            adminSubmissionModal
        ) {
            closeAdminSubmissionModal();
        }

    }
);


/* ---------- OPEN VIEW BUTTON ---------- */

adminSubmissionsList?.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(
                ".admin-submission-view"
            );

        if (!viewButton) {
            return;
        }

        const submissionId =
            viewButton.dataset.submissionId;

        const submission =
            adminSubmissions.find(
                item =>
                    String(item.id) ===
                    String(submissionId)
            );

        if (!submission) {

            console.error(
                "Submission not found:",
                submissionId
            );

            return;
        }

        selectedModalSubmission = submission;

        openAdminSubmissionModal(
            submission
        );

    }
);


/* ---------- ESCAPE KEY ---------- */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            adminSubmissionModal?.style.display ===
                "flex"
        ) {
            closeAdminSubmissionModal();
        }

    }
);

/* =========================================
   INITIAL DASHBOARD STATS
========================================= */

setTimeout(async () => {
    await loadAdminUserStats();
    await loadAdminSubmissionStats();
}, 100);

/* =========================================
   ADMIN LIVE UPDATES
========================================= */

const adminRealtimeChannel =
    vaultSupabase
        .channel("admin-dashboard-live")

        /* USERS */
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "profiles"
            },
            async () => {

                await loadAdminUserStats();

                if (
                    adminUsersPanel &&
                    adminUsersPanel.style.display !== "none"
                ) {
                    await loadAdminUsers();
                }

            }
        )

        /* SUBMISSIONS */
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "submissions"
            },
            async () => {

                await loadAdminSubmissionStats();

                if (
                    adminSubmissionsPanel &&
                    adminSubmissionsPanel.style.display !== "none"
                ) {
                    await loadAdminSubmissions();
                }

            }
        )

        .subscribe();

/* =========================================
   MODAL MODERATION ACTIONS
========================================= */

const modalApproveButton =
    document.getElementById("admin-submission-modal-approve");

const modalRejectButton =
    document.getElementById("admin-submission-modal-reject");

const modalReasonBox =
    document.getElementById("admin-submission-view-reason");

const modalReasonText =
    document.getElementById("admin-submission-view-reason-text");

let selectedModalSubmission = null;




/* =========================================
   CUSTOM ADMIN DECISION MODAL
========================================= */

function showAdminDecisionModal(type) {

    return new Promise(resolve => {

        const isApprove =
            type === "approve";

        const overlay =
            document.createElement("div");

        overlay.className =
            "admin-decision-overlay";

        overlay.innerHTML = `
            <div class="admin-decision-modal">

                <button
                    type="button"
                    class="admin-decision-close"
                    data-action="cancel"
                >
                    ×
                </button>

                <div class="admin-decision-icon ${
                    isApprove
                        ? "approve"
                        : "reject"
                }">
                    ${
                        isApprove
                            ? "✓"
                            : "!"
                    }
                </div>

                <p class="admin-label">
                    ◆ ${
                        isApprove
                            ? "APPROVE SUBMISSION"
                            : "REJECT SUBMISSION"
                    }
                </p>

                <h2>
                    ${
                        isApprove
                            ? "Approve this submission?"
                            : "Reject this submission?"
                    }
                </h2>

                <p class="admin-decision-description">
                    ${
                        isApprove
                            ? "This submission will be marked as approved and made available for publication."
                            : "This submission will be marked as rejected. Please provide a reason below."
                    }
                </p>

                ${
                    isApprove
                        ? ""
                        : `
                            <label
                                class="admin-decision-input-label"
                                for="admin-rejection-input"
                            >
                                REJECTION REASON
                            </label>

                            <textarea
                                id="admin-rejection-input"
                                class="admin-decision-input"
                                placeholder="Enter the reason for rejecting this submission..."
                                rows="4"
                                maxlength="500"
                            ></textarea>

                            <div
                                class="admin-decision-error"
                                style="display:none;"
                            >
                                Please enter a rejection reason.
                            </div>
                        `
                }

                <div class="admin-decision-actions">

                    <button
                        type="button"
                        class="admin-decision-cancel"
                        data-action="cancel"
                    >
                        CANCEL
                    </button>

                    <button
                        type="button"
                        class="${
                            isApprove
                                ? "admin-decision-confirm approve"
                                : "admin-decision-confirm reject"
                        }"
                        data-action="confirm"
                    >
                        ${
                            isApprove
                                ? "APPROVE SUBMISSION"
                                : "REJECT SUBMISSION"
                        }
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add("visible");
        });

        const cleanup = result => {

            overlay.classList.remove(
                "visible"
            );

            setTimeout(() => {
                overlay.remove();
            }, 180);

            resolve(result);
        };

        overlay
            .querySelectorAll(
                '[data-action="cancel"]'
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => cleanup(null)
                );

            });

        const confirmButton =
            overlay.querySelector(
                '[data-action="confirm"]'
            );

        confirmButton.addEventListener(
            "click",
            () => {

                if (isApprove) {
                    cleanup(true);
                    return;
                }

                const input =
                    overlay.querySelector(
                        "#admin-rejection-input"
                    );

                const error =
                    overlay.querySelector(
                        ".admin-decision-error"
                    );

                const reason =
                    input.value.trim();

                if (!reason) {

                    error.style.display =
                        "block";

                    input.focus();

                    return;
                }

                cleanup(reason);
            }
        );

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {
                    cleanup(null);
                }

            }
        );

        document.addEventListener(
            "keydown",
            function escapeHandler(event) {

                if (event.key === "Escape") {

                    document.removeEventListener(
                        "keydown",
                        escapeHandler
                    );

                    cleanup(null);
                }

            }
        );

        if (!isApprove) {

            const input =
                overlay.querySelector(
                    "#admin-rejection-input"
                );

            setTimeout(() => {
                input?.focus();
            }, 100);

        }

    });
}


/* ---------- APPROVE FROM MODAL ---------- */

modalApproveButton?.addEventListener(
    "click",
    async () => {

        if (!selectedModalSubmission) {
            return;
        }

        const confirmed =
            await showAdminDecisionModal(
                "approve"
            );

        if (!confirmed) {
            return;
        }

        modalApproveButton.disabled =
            true;

        modalApproveButton.textContent =
            "APPROVING...";

        const {
            error
        } = await vaultSupabase
            .from("submissions")
            .update({
                status: "approved",
                rejection_reason: null
            })
            .eq(
                "id",
                selectedModalSubmission.id
            );

        if (error) {

            console.error(
                "Approval failed:",
                error
            );

            alert(
                error.message ||
                "Unable to approve submission."
            );

            modalApproveButton.disabled =
                false;

            modalApproveButton.textContent =
                "APPROVE";

            return;
        }

        await writeAdminAuditLog({
    action: "approved",
    targetType:
        selectedModalSubmission.type ||
        "submission",
    targetId:
        selectedModalSubmission.id,
    targetName:
        selectedModalSubmission.title ||
        "Unknown submission",
    details: {}
});

        closeAdminSubmissionModal();

        await loadAdminSubmissions();
        await loadAdminSubmissionStats();

    }
);


/* ---------- REJECT FROM MODAL ---------- */

modalRejectButton?.addEventListener(
    "click",
    async () => {

        if (!selectedModalSubmission) {
            return;
        }

        const reason =
            await showAdminDecisionModal(
                "reject"
            );

        if (!reason) {
            return;
        }

        modalRejectButton.disabled =
            true;

        modalRejectButton.textContent =
            "REJECTING...";

        const {
            error
        } = await vaultSupabase
            .from("submissions")
            .update({
                status: "rejected",
                rejection_reason:
                    reason.trim()
            })
            .eq(
                "id",
                selectedModalSubmission.id
            );

        if (error) {

            console.error(
                "Rejection failed:",
                error
            );

            alert(
                error.message ||
                "Unable to reject submission."
            );

            modalRejectButton.disabled =
                false;

            modalRejectButton.textContent =
                "REJECT";

            return;
        }

        await writeAdminAuditLog({
    action: "rejected",
    targetType:
        selectedModalSubmission.type ||
        "submission",
    targetId:
        selectedModalSubmission.id,
    targetName:
        selectedModalSubmission.title ||
        "Unknown submission",
    details: {
        rejection_reason:
            reason.trim()
    }
});

        closeAdminSubmissionModal();

        await loadAdminSubmissions();
        await loadAdminSubmissionStats();

    }
);  

/* =========================================
   ADMIN CONTENT
========================================= */

const adminContentButton =
    document.getElementById("admin-content-button");

const adminContentPanel =
    document.getElementById("admin-content-panel");

const adminContentSearch =
    document.getElementById("admin-content-search");

const adminContentFilter =
    document.getElementById("admin-content-filter");

const adminContentList =
    document.getElementById("admin-content-list");

let adminContent = [];


/* ---------- LOAD CONTENT ---------- */

async function loadAdminContent() {

    if (!adminContentList) {
        return;
    }

    adminContentList.innerHTML =
        `<p class="admin-loading">
            LOADING CONTENT...
        </p>`;

    const {
        data,
        error
    } = await vaultSupabase
        .from("submissions")
        .select(`
            id,
            user_id,
            title,
            type,
            description,
            preview_url,
            download_url,
            status,
            created_at,
            updated_at
        `)
        .in("status", [
            "approved",
            "rejected"
        ])
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Unable to load content:",
            error
        );

        adminContentList.innerHTML =
            `<p class="admin-loading">
                UNABLE TO LOAD CONTENT
            </p>`;

        return;
    }

    adminContent = data || [];

    renderAdminContent();
}


/* ---------- RENDER CONTENT ---------- */

function renderAdminContent() {

    if (!adminContentList) {
        return;
    }

    const search =
        adminContentSearch?.value
            .trim()
            .toLowerCase() || "";

    const filter =
        adminContentFilter?.value ||
        "all";

    const filtered =
        adminContent.filter(item => {

            const title =
                (item.title || "")
                    .toLowerCase();

            const type =
                (item.type || "")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                title.includes(search);

            const matchesFilter =
                filter === "all" ||
                type === filter;

            return (
                matchesSearch &&
                matchesFilter
            );
        });


    if (!filtered.length) {

        adminContentList.innerHTML =
            `<p class="admin-loading">
                NO CONTENT FOUND
            </p>`;

        return;
    }


    adminContentList.innerHTML =
        filtered.map(item => {

            const isPublished =
                item.status === "approved";

            const type =
                (item.type || "content")
                    .replace("-", " ")
                    .toUpperCase();

            const date =
                item.created_at
                    ? new Date(
                        item.created_at
                    ).toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    ).toUpperCase()
                    : "UNKNOWN";


            return `
                <div
                    class="admin-content-row"
                    data-title="${(
                        item.title || ""
                    ).toLowerCase()}"
                    data-type="${(
                        item.type || ""
                    ).toLowerCase()}"
                >

                    <div
                        class="admin-content-preview"
                    >
                        ${
                            item.preview_url
                                ? `
                                    <img
                                        src="${item.preview_url}"
                                        alt=""
                                    >
                                `
                                : `
                                    <span>
                                        NO PREVIEW
                                    </span>
                                `
                        }
                    </div>


                    <div
                        class="admin-content-info"
                    >

                        <strong>
                            ${
                                item.title ||
                                "UNTITLED"
                            }
                        </strong>

                        <small>
                            ${type}
                            &nbsp; • &nbsp;
                            ${date}
                        </small>

                        <p>
                            ${
                                item.description ||
                                "No description provided."
                            }
                        </p>

                    </div>


                    <div
                        class="admin-content-status
                        ${
                            isPublished
                                ? "published"
                                : "removed"
                        }"
                    >
                        ${
                            isPublished
                                ? "PUBLISHED"
                                : "REMOVED"
                        }
                    </div>


                    <div
                        class="admin-content-actions"
                    >

                        ${
                            item.download_url
                                ? `
                                    <a
                                        href="${item.download_url}"
                                        target="_blank"
                                        rel="noopener"
                                        class="admin-content-view"
                                    >
                                        VIEW
                                    </a>
                                `
                                : ""
                        }

                        ${
                            isPublished
                                ? `
                                    <button
                                        type="button"
                                        class="admin-content-remove"
                                        data-content-id="${item.id}"
                                    >
                                        REMOVE
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="admin-content-restore"
                                        data-content-id="${item.id}"
                                    >
                                        RESTORE
                                    </button>
                                `
                        }

                    </div>

                </div>
            `;

        }).join("");
}


/* ---------- OPEN CONTENT ---------- */

adminContentButton?.addEventListener(
    "click",
    async () => {

        if (!adminContentPanel) {
            return;
        }

        adminContentPanel.style.display =
            "block";

        await loadAdminContent();

        adminContentPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* ---------- SEARCH ---------- */

adminContentSearch?.addEventListener(
    "input",
    renderAdminContent
);


/* ---------- FILTER ---------- */

adminContentFilter?.addEventListener(
    "change",
    renderAdminContent
);


/* ---------- REMOVE / RESTORE ---------- */

adminContentList?.addEventListener(
    "click",
    async event => {

        const removeButton =
            event.target.closest(
                ".admin-content-remove"
            );

        const restoreButton =
            event.target.closest(
                ".admin-content-restore"
            );


        if (
            !removeButton &&
            !restoreButton
        ) {
            return;
        }


        const button =
            removeButton ||
            restoreButton;

        const contentId =
            button.dataset.contentId;


        const newStatus =
            removeButton
                ? "rejected"
                : "approved";


        button.disabled = true;

        button.textContent =
            removeButton
                ? "REMOVING..."
                : "RESTORING...";


        const {
            error
        } = await vaultSupabase
            .from("submissions")
            .update({
                status: newStatus,
                rejection_reason:
                    removeButton
                        ? "Removed by admin."
                        : null
            })
            .eq("id", contentId);


        if (error) {

            console.error(
                "Unable to update content:",
                error
            );

            button.disabled = false;

            button.textContent =
                removeButton
                    ? "REMOVE"
                    : "RESTORE";

            return;
        }

        const contentItem =
    adminContent.find(
        item =>
            String(item.id) ===
            String(contentId)
    );

await writeAdminAuditLog({
    action:
        removeButton
            ? "removed"
            : "restored",
    targetType:
        contentItem?.type || "content",
    targetId:
        contentId,
    targetName:
        contentItem?.title ||
        "Unknown content",
    details: {}
});


        await loadAdminContent();

        await loadAdminSubmissionStats();

    }
);


/* ---------- OPEN CONTENT ---------- */

adminContentButton?.addEventListener(
    "click",
    () => {

        if (!adminContentPanel) {
            return;
        }

        adminContentPanel.style.display =
            "block";

        adminContentPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* ---------- SEARCH CONTENT ---------- */

function filterAdminContent() {

    const search =
        adminContentSearch?.value
            .trim()
            .toLowerCase() || "";

    const filter =
        adminContentFilter?.value ||
        "all";

    const rows =
        adminContentList?.querySelectorAll(
            ".admin-content-row"
        ) || [];

    rows.forEach(row => {

        const title =
            row.dataset.title || "";

        const type =
            row.dataset.type || "";

        const matchesSearch =
            !search ||
            title.includes(search);

        const matchesFilter =
            filter === "all" ||
            type === filter;

        row.style.display =
            matchesSearch &&
            matchesFilter
                ? ""
                : "none";

    });

}


adminContentSearch?.addEventListener(
    "input",
    filterAdminContent
);


adminContentFilter?.addEventListener(
    "change",
    filterAdminContent
);

/* =========================================
   ADMIN AUDIT LOG
========================================= */

const adminAuditButton =
    document.getElementById("admin-audit-button");

const adminAuditPanel =
    document.getElementById("admin-audit-panel");

const adminAuditList =
    document.getElementById("admin-audit-list");

const adminAuditSearch =
    document.getElementById("admin-audit-search");

const adminAuditFilter =
    document.getElementById("admin-audit-filter");


/* ---------- WRITE AUDIT LOG ---------- */

async function writeAdminAuditLog({
    action,
    targetType = null,
    targetId = null,
    targetName = null,
    details = {}
}) {

    try {

        const {
            data: {
                user
            }
        } = await vaultSupabase.auth.getUser();

        if (!user) {
            return;
        }

        const {
            error
        } = await vaultSupabase
            .from("audit_logs")
            .insert({
                admin_id: user.id,
                action,
                target_type: targetType,
                target_id: targetId
                    ? String(targetId)
                    : null,
                target_name: targetName,
                details
            });

        if (error) {
            console.error(
                "Unable to write audit log:",
                error
            );
        }

    } catch (error) {

        console.error(
            "Audit log error:",
            error
        );

    }
}


/* ---------- LOAD AUDIT LOG ---------- */

async function loadAdminAuditLog() {

    if (!adminAuditList) {
        return;
    }

    adminAuditList.innerHTML =
        `<p class="admin-loading">
            LOADING AUDIT LOG...
        </p>`;

    const {
        data,
        error
    } = await vaultSupabase
        .from("audit_logs")
        .select(`
            id,
            admin_id,
            action,
            target_type,
            target_id,
            target_name,
            details,
            created_at
        `)
        .order("created_at", {
            ascending: false
        })
        .limit(100);

    if (error) {

        console.error(
            "Unable to load audit log:",
            error
        );

        adminAuditList.innerHTML =
            `<p class="admin-loading">
                UNABLE TO LOAD AUDIT LOG
            </p>`;

        return;
    }

    renderAdminAuditLog(
        data || []
    );
}


/* ---------- RENDER ---------- */

function renderAdminAuditLog(entries) {

    if (!adminAuditList) {
        return;
    }

    const search =
        adminAuditSearch?.value
            .trim()
            .toLowerCase() || "";

    const filter =
        adminAuditFilter?.value ||
        "all";

    const filtered =
        entries.filter(entry => {

            const action =
                (entry.action || "")
                    .toLowerCase();

            const target =
                (entry.target_name || "")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                action.includes(search) ||
                target.includes(search);

            const matchesFilter =
                filter === "all" ||
                action.includes(filter);

            return (
                matchesSearch &&
                matchesFilter
            );

        });


    if (!filtered.length) {

        adminAuditList.innerHTML =
            `<p class="admin-loading">
                NO AUDIT LOG ENTRIES FOUND
            </p>`;

        return;
    }


    adminAuditList.innerHTML =
        filtered.map(entry => {

            const date =
                new Date(
                    entry.created_at
                ).toLocaleString(
                    "en-GB",
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );

            const action =
                (entry.action || "UNKNOWN")
                    .replaceAll("_", " ")
                    .toUpperCase();

            const target =
                entry.target_name ||
                "UNKNOWN";

            const type =
                entry.target_type
                    ? entry.target_type
                        .replaceAll("-", " ")
                        .toUpperCase()
                    : "SYSTEM";

            const actionClass =
                action.includes("APPROVED")
                    ? "approved"
                    : action.includes("REJECTED")
                        ? "rejected"
                        : action.includes("BANNED")
                            ? "banned"
                            : action.includes("REMOVED")
                                ? "removed"
                                : action.includes("RESTORED")
                                    ? "restored"
                                    : "";


            return `
                <div
                    class="admin-audit-row ${actionClass}"
                    data-action="${action.toLowerCase()}"
                    data-target="${target.toLowerCase()}"
                >

                    <div class="admin-audit-icon">
                        ◆
                    </div>

                    <div class="admin-audit-info">

                        <strong>
                            ${action}
                        </strong>

                        <small>
                            ${type}
                            &nbsp; • &nbsp;
                            ${target}
                        </small>

                    </div>

                    <div class="admin-audit-date">
                        ${date}
                    </div>

                </div>
            `;

        }).join("");
}


/* ---------- OPEN AUDIT LOG ---------- */

adminAuditButton?.addEventListener(
    "click",
    async () => {

        if (!adminAuditPanel) {
            return;
        }

        adminAuditPanel.style.display =
            "block";

        await loadAdminAuditLog();

        adminAuditPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* ---------- SEARCH ---------- */

adminAuditSearch?.addEventListener(
    "input",
    loadAdminAuditLog
);


/* ---------- FILTER ---------- */

adminAuditFilter?.addEventListener(
    "change",
    loadAdminAuditLog
);

