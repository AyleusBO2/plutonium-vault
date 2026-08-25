// =========================================================
// PLUTONIUM VAULT — ACCOUNT SYSTEM
// =========================================================

const SUPABASE_URL = "https://elehnmxyftpljfyslahf.supabase.co";
const SUPABASE_KEY = "sb_publishable_vfKK8KwMX5_TMkjEv1FPzw_W3Y4oCz4";

const vaultSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =========================================================
// LOGIN
// =========================================================

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document
            .getElementById("login-email")
            .value
            .trim();

        const password = document
            .getElementById("login-password")
            .value;

        const message = document.getElementById("login-message");
        const button = document.getElementById("login-button");

        message.textContent = "";
        button.disabled = true;
        button.textContent = "SIGNING IN...";

        try {

            const { data, error } =
                await vaultSupabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

         if (error) {
    throw error;
}

/* -----------------------------------------
   CHECK VAULT BAN
----------------------------------------- */

const {
    data: banned,
    error: banCheckError
} = await vaultSupabase.rpc(
    "is_user_banned",
    {
        target_user_id: data.user.id
    }
);

if (banCheckError) {
    await vaultSupabase.auth.signOut();
    throw banCheckError;
}

if (banned) {

    const {
        data: banProfile
    } = await vaultSupabase
        .from("profiles")
        .select(`
            ban_reason,
            banned_until
        `)
        .eq("id", data.user.id)
        .single();

    await vaultSupabase.auth.signOut();

    message.classList.add(
        "banned-message"
    );

    message.textContent =
        banProfile?.ban_reason
            ? `ACCOUNT BANNED — ${banProfile.ban_reason}`
            : "THIS ACCOUNT IS CURRENTLY BANNED";

    return;
}

message.textContent =
    "LOGIN SUCCESSFUL";

// Send the user back to Plutonium Vault
window.location.href =
    "index.html";   

        } catch (error) {

            console.error("Login error:", error);

            if (error.message === "Invalid login credentials") {
                message.textContent = "INVALID EMAIL OR PASSWORD";
            } else if (error.message === "Email not confirmed") {
                message.textContent = "VERIFY YOUR EMAIL BEFORE LOGGING IN";
            } else {
                message.textContent = error.message.toUpperCase();
            }

        } finally {

            button.disabled = false;
            button.textContent = "LOGIN";

        }

    });

}

// =========================================================
// SIGN UP
// =========================================================

const signupForm = document.getElementById("signup-form");

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const username = document
            .getElementById("signup-username")
            .value
            .trim();

        const email = document
            .getElementById("signup-email")
            .value
            .trim();

        const password =
            document.getElementById("signup-password").value;

        const confirmPassword =
            document.getElementById("signup-confirm-password").value;

        const message =
            document.getElementById("signup-message");

        const button =
            document.getElementById("signup-button");


        // Clear previous message
        message.textContent = "";


        // Username validation
        if (username.length < 3 || username.length > 24) {
            message.textContent =
                "USERNAME MUST BE BETWEEN 3 AND 24 CHARACTERS";
            return;
        }


        // Only allow safe username characters
        const usernamePattern = /^[a-zA-Z0-9_-]+$/;

        if (!usernamePattern.test(username)) {
            message.textContent =
                "USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, _ AND -";
            return;
        }


        // Password confirmation
        if (password !== confirmPassword) {
            message.textContent =
                "PASSWORDS DO NOT MATCH";
            return;
        }


        button.disabled = true;
        button.textContent = "CREATING ACCOUNT...";


        try {

            const { data, error } =
                await vaultSupabase.auth.signUp({

                    email: email,
                    password: password,

                    options: {

                        data: {
                            username: username
                        },

                        emailRedirectTo:
                            "https://ayleusbo2.github.io/plutonium-vault/login.html"
                    }

                });


            if (error) {
                throw error;
            }


            message.textContent =
                "ACCOUNT CREATED — CHECK YOUR EMAIL TO VERIFY YOUR ACCOUNT";

            signupForm.reset();


        } catch (error) {

            console.error("Signup error:", error);

            if (
                error.message &&
                error.message.toLowerCase().includes("already registered")
            ) {

                message.textContent =
                    "AN ACCOUNT ALREADY EXISTS WITH THIS EMAIL";

            } else {

                message.textContent =
                    error.message.toUpperCase();

            }

        } finally {

            button.disabled = false;
            button.textContent = "CREATE ACCOUNT";

        }

    });

}

// =========================================================
// ACCOUNT PAGE
// =========================================================

const accountUsername =
    document.getElementById("account-display-username");

const accountEmail =
    document.getElementById("account-email");

const accountEmailStatus =
    document.getElementById("account-email-status");

const accountRole =
    document.getElementById("account-role");

const accountCreated =
    document.getElementById("account-created");

const accountAvatar =
    document.getElementById("account-avatar");

const accountAvatarFallback =
    document.getElementById("account-avatar-fallback");

const accountMessage =
    document.getElementById("account-message");

const logoutButton =
    document.getElementById("logout-button");

    const avatarInput =
    document.getElementById("avatar-file-input");

const changeAvatarButton =
    document.getElementById("change-avatar-button");

const accountDisplayUsername =
    document.getElementById("account-display-username");

const accountRoleBadge =
    document.getElementById("account-role-badge");  
    
    const accountDownloads =
    document.getElementById("account-downloads");

const accountSavedItems =
    document.getElementById("account-saved-items");

    const editUsernameButton =
    document.getElementById("edit-username-button");

 const changePasswordButton =
    document.getElementById("change-password-button");   


async function loadAccountPage() {

    // Only run this on account.html
    if (!accountUsername) {
        return;
    }


    const {
        data: {
            user
        },
        error: userError
    } =
        await vaultSupabase.auth.getUser();


    // Not logged in
    if (userError || !user) {

        window.location.href =
            "login.html";

        return;
    }


    // Get matching Vault profile
    const {
        data: profile,
        error: profileError
    } =
        await vaultSupabase
            .from("profiles")
            .select(`
                username,
                avatar_url,
                role,
                created_at,
                is_banned
            `)
            .eq("id", user.id)
            .single();


    if (profileError) {

        console.error(
            "Profile load error:",
            profileError
        );

        accountMessage.textContent =
            "UNABLE TO LOAD VAULT PROFILE";

        return;
    }


    // Username
    accountUsername.textContent =
        profile.username || "UNKNOWN";

    if (accountDisplayUsername) {
    accountDisplayUsername.textContent =
        profile.username || "UNKNOWN";
}


    // Email
    accountEmail.textContent =
        user.email || "UNKNOWN";


    // Email verified status
    if (user.email_confirmed_at) {

        accountEmailStatus.textContent =
            "VERIFIED";

        accountEmailStatus.classList.add(
            "account-verified"
        );

    } else {

        accountEmailStatus.textContent =
            "NOT VERIFIED";

    }


    // Role
    

            if (accountRoleBadge) {
    accountRoleBadge.textContent =
        profile.role === "admin"
            ? "ADMIN"
            : "USER";
}

const adminPanelLink =
    document.getElementById("admin-panel-link");

if (adminPanelLink) {
    adminPanelLink.style.display =
        profile.role === "admin"
            ? "block"
            : "none";
}


    // Join date
    const joinDate =
        new Date(profile.created_at);

    accountCreated.textContent =
        joinDate.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).toUpperCase();

 // Saved items
if (accountSavedItems) {

    const {
        count: savedItemCount,
        error: savedItemCountError
    } = await vaultSupabase
        .from("saved_items")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("user_id", user.id);

    if (savedItemCountError) {

        console.error(
            "Saved item count error:",
            savedItemCountError
        );

        accountSavedItems.textContent = "0";

    } else {

        accountSavedItems.textContent =
            savedItemCount || 0;

    }

}       


// Downloads
if (accountDownloads) {

    const {
        count: downloadCount,
        error: downloadCountError
    } = await vaultSupabase
        .from("user_downloads")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("user_id", user.id);

    if (downloadCountError) {

        console.error(
            "Download count error:",
            downloadCountError
        );

        accountDownloads.textContent = "0";

    } else {

        accountDownloads.textContent =
            downloadCount || 0;

    }

}


    // Profile picture
    if (profile.avatar_url) {

        accountAvatar.src =
            profile.avatar_url;

        accountAvatar.style.display =
            "block";

        accountAvatarFallback.style.display =
            "none";

    } else {

        accountAvatar.style.display =
            "none";

        accountAvatarFallback.style.display =
            "flex";

        accountAvatarFallback.textContent =
            profile.username
                ? profile.username
                    .charAt(0)
                    .toUpperCase()
                : "?";

    }


    // =========================================================
// BAN ENFORCEMENT
// =========================================================

if (profile.is_banned) {

    const banStillActive =
        !profile.banned_until ||
        new Date(profile.banned_until) > new Date();

    if (banStillActive) {

        await vaultSupabase.auth.signOut();

        window.location.href =
            "login.html?banned=1";

        return;
    }

}

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "LOGGING OUT...";


            await vaultSupabase.auth.signOut();


            window.location.href =
                "login.html";

        }
    );

}

// =========================================================
// AVATAR PICKER
// =========================================================

if (
    changeAvatarButton &&
    avatarInput
) {

    changeAvatarButton.addEventListener(
        "click",
        () => {

            avatarInput.click();

        }
    );

}

avatarInput?.addEventListener(
    "change",
    async () => {

        const file = avatarInput.files[0];

        if (!file) {
            return;
        }

        // Only allow supported image formats
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            accountMessage.textContent =
                "PROFILE PICTURE MUST BE JPG, PNG OR WEBP";

            avatarInput.value = "";
            return;
        }

        // Maximum avatar size: 5 MB
        if (file.size > 5 * 1024 * 1024) {

            accountMessage.textContent =
                "PROFILE PICTURE MUST BE UNDER 5MB";

            avatarInput.value = "";
            return;
        }

        changeAvatarButton.disabled = true;
        changeAvatarButton.textContent = "UPLOADING...";

        accountMessage.textContent = "";

        try {

            const {
                data: { user },
                error: userError
            } = await vaultSupabase.auth.getUser();

            if (userError || !user) {
                throw new Error("YOU MUST BE LOGGED IN");
            }

            const extension =
                file.name.split(".").pop().toLowerCase();

            const filePath =
                `${user.id}/avatar.${extension}`;

            // Upload/replace avatar
            const {
                error: uploadError
            } = await vaultSupabase
                .storage
                .from("avatars")
                .upload(
                    filePath,
                    file,
                    {
                        upsert: true,
                        contentType: file.type
                    }
                );

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const {
                data: publicUrlData
            } = vaultSupabase
                .storage
                .from("avatars")
                .getPublicUrl(filePath);

            const avatarUrl =
                `${publicUrlData.publicUrl}?v=${Date.now()}`;

            // Save URL to profile
            const {
                error: profileError
            } = await vaultSupabase
                .from("profiles")
                .update({
                    avatar_url: avatarUrl
                })
                .eq("id", user.id);

            if (profileError) {
                throw profileError;
            }

            // Immediately show new avatar
            accountAvatar.src = avatarUrl;
            accountAvatar.style.display = "block";
            accountAvatarFallback.style.display = "none";

            accountMessage.textContent =
                "PROFILE PICTURE UPDATED";

        } catch (error) {

            console.error(
                "Avatar upload error:",
                error
            );

            accountMessage.textContent =
                error.message
                    ? error.message.toUpperCase()
                    : "UNABLE TO UPDATE PROFILE PICTURE";

        } finally {

            changeAvatarButton.disabled = false;

            changeAvatarButton.textContent =
                "CHANGE PROFILE PICTURE";

            avatarInput.value = "";

        }

    }
);

// =========================================================
// EDIT USERNAME MODAL
// =========================================================

const usernameModal =
    document.getElementById("username-modal");

const usernameModalInput =
    document.getElementById("username-modal-input");

const usernameModalMessage =
    document.getElementById("username-modal-message");

const usernameModalSave =
    document.getElementById("username-modal-save");

const usernameModalCancel =
    document.getElementById("username-modal-cancel");

const usernameModalClose =
    document.getElementById("username-modal-close");


function openUsernameModal() {

    if (!usernameModal) {
        return;
    }

    usernameModal.classList.add("active");
    usernameModal.setAttribute("aria-hidden", "false");

    if (usernameModalInput) {
        usernameModalInput.value =
            accountDisplayUsername?.textContent
                ?.trim() || "";

        usernameModalInput.focus();
        usernameModalInput.select();
    }

    if (usernameModalMessage) {
        usernameModalMessage.textContent = "";
    }

}


function closeUsernameModal() {

    if (!usernameModal) {
        return;
    }

    usernameModal.classList.remove("active");
    usernameModal.setAttribute("aria-hidden", "true");

    if (usernameModalMessage) {
        usernameModalMessage.textContent = "";
    }

}


if (editUsernameButton) {

    editUsernameButton.addEventListener(
        "click",
        openUsernameModal
    );

}


usernameModalCancel?.addEventListener(
    "click",
    closeUsernameModal
);


usernameModalClose?.addEventListener(
    "click",
    closeUsernameModal
);


usernameModal?.addEventListener(
    "click",
    (event) => {

        if (event.target === usernameModal) {
            closeUsernameModal();
        }

    }
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            usernameModal?.classList.contains("active")
        ) {
            closeUsernameModal();
        }

    }
);


usernameModalSave?.addEventListener(
    "click",
    async () => {

        const username =
            usernameModalInput?.value.trim() || "";

        if (
            username.length < 3 ||
            username.length > 24
        ) {

            usernameModalMessage.textContent =
                "USERNAME MUST BE BETWEEN 3 AND 24 CHARACTERS";

            return;
        }

        const usernamePattern =
            /^[a-zA-Z0-9_-]+$/;

        if (!usernamePattern.test(username)) {

            usernameModalMessage.textContent =
                "USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, _ AND -";

            return;
        }


        usernameModalSave.disabled = true;
        usernameModalSave.textContent =
            "SAVING...";

        usernameModalMessage.textContent = "";


        try {

            const {
                data: { user },
                error: userError
            } =
                await vaultSupabase.auth.getUser();

            if (userError || !user) {
                throw new Error(
                    "YOU MUST BE LOGGED IN"
                );
            }


            const {
                error: updateError
            } =
                await vaultSupabase
                    .from("profiles")
                    .update({
                        username: username
                    })
                    .eq(
                        "id",
                        user.id
                    );


            if (updateError) {
                throw updateError;
            }


            if (accountDisplayUsername) {
                accountDisplayUsername.textContent =
                    username;
            }

            if (accountUsername) {
                accountUsername.textContent =
                    username;
            }


            accountMessage.textContent =
                "USERNAME UPDATED";


            closeUsernameModal();


        } catch (error) {

            console.error(
                "Username update error:",
                error
            );


            if (
                error.code === "23505" ||
                error.message
                    ?.toLowerCase()
                    .includes("duplicate")
            ) {

                usernameModalMessage.textContent =
                    "THAT USERNAME IS ALREADY TAKEN";

            } else {

                usernameModalMessage.textContent =
                    error.message
                        ? error.message.toUpperCase()
                        : "UNABLE TO UPDATE USERNAME";

            }


        } finally {

            usernameModalSave.disabled = false;
            usernameModalSave.textContent =
                "SAVE USERNAME";

        }

    }
);

// =========================================================
// CHANGE PASSWORD MODAL
// =========================================================

const passwordModal =
    document.getElementById("password-modal");

const passwordModalInput =
    document.getElementById("password-modal-input");

const passwordModalConfirm =
    document.getElementById("password-modal-confirm");

const passwordModalMessage =
    document.getElementById("password-modal-message");

const passwordModalSave =
    document.getElementById("password-modal-save");

const passwordModalCancel =
    document.getElementById("password-modal-cancel");

const passwordModalClose =
    document.getElementById("password-modal-close");


function openPasswordModal() {

    if (!passwordModal) {
        return;
    }

    passwordModal.classList.add("active");
    passwordModal.setAttribute("aria-hidden", "false");

    passwordModalInput.value = "";
    passwordModalConfirm.value = "";
    passwordModalMessage.textContent = "";

    passwordModalInput.focus();
}


function closePasswordModal() {

    if (!passwordModal) {
        return;
    }

    passwordModal.classList.remove("active");
    passwordModal.setAttribute("aria-hidden", "true");

    passwordModalInput.value = "";
    passwordModalConfirm.value = "";
    passwordModalMessage.textContent = "";
}


if (changePasswordButton) {

    changePasswordButton.addEventListener(
        "click",
        openPasswordModal
    );

}


passwordModalCancel?.addEventListener(
    "click",
    closePasswordModal
);


passwordModalClose?.addEventListener(
    "click",
    closePasswordModal
);


passwordModal?.addEventListener(
    "click",
    (event) => {

        if (event.target === passwordModal) {
            closePasswordModal();
        }

    }
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            passwordModal?.classList.contains("active")
        ) {
            closePasswordModal();
        }

    }
);


passwordModalSave?.addEventListener(
    "click",
    async () => {

        const password =
            passwordModalInput?.value || "";

        const confirmPassword =
            passwordModalConfirm?.value || "";


        if (password.length < 6) {

            passwordModalMessage.textContent =
                "PASSWORD MUST BE AT LEAST 6 CHARACTERS";

            return;
        }


        if (password !== confirmPassword) {

            passwordModalMessage.textContent =
                "PASSWORDS DO NOT MATCH";

            return;
        }


        passwordModalSave.disabled = true;
        passwordModalSave.textContent =
            "UPDATING...";

        passwordModalMessage.textContent = "";


        try {

            const { error } =
                await vaultSupabase.auth.updateUser({
                    password: password
                });


            if (error) {
                throw error;
            }


            accountMessage.textContent =
                "PASSWORD UPDATED";


            closePasswordModal();


        } catch (error) {

            console.error(
                "Password update error:",
                error
            );

            passwordModalMessage.textContent =
                error.message
                    ? error.message.toUpperCase()
                    : "UNABLE TO UPDATE PASSWORD";


        } finally {

            passwordModalSave.disabled = false;
            passwordModalSave.textContent =
                "UPDATE PASSWORD";

        }

    }
);


loadAccountPage();