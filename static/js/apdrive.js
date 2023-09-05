let path = "/";
let currentDirs = [];
let currentFiles = [];

const startPath = "/";
const url = "http://127.0.0.1:8000/webhdfs/";
const uploadUrl = "http://127.0.0.1:8000/webhdfs_upload/";
const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

function calculateSize(size) {
    let sizeNum = parseInt(size, 10);
    let units = ["TB", "GB", "MB", "KB", "B"];
    while (Math.floor(sizeNum / 1024) !== 0) {
        units.pop();
        sizeNum = sizeNum / 1024;
    }
    return sizeNum.toFixed(3) + units.pop();
}

function addToPath(name) {
    if (path.length == 1) {
        path += name;
    } else {
        path += `/${name}`;
    }
}

function popFromPath() {
    let idx = path.lastIndexOf("/");
    if (idx == 0) path = "/";
    path = path.slice(0, idx);
}

function addBreadcrumb(name) {
    const bcContainer = document.getElementById("breadcrumbs");
    const bc = document.createElement("li");
    bc.classList.add("breadcrumb-item");
    bc.textContent = name;
    bcContainer.appendChild(bc);
}

function popBreadcrumb() {
    const bcContainer = document.getElementById("breadcrumbs");
    bcContainer.removeChild(bcContainer.lastChild);
}

function checkBackButton() {
    const bcContainer = document.getElementById("breadcrumbs");
    const backButton = document.getElementById("backBtn");
    if (bcContainer.childElementCount > 1) {
        if (backButton.style.display === "none") {
            backButton.style.display = "block";
        }
    } else {
        if (backButton.style.display !== "none") {
            backButton.style.display = "none";
        }
    }
}

function createToast(message) {
    const toastContainerDiv = document.getElementById("toastContainer");
    const toastDiv = document.createElement("div");
    toastDiv.classList.add("toast", "text-bg-info", "align-items-center");
    toastDiv.setAttribute("role", "alert");
    toastDiv.setAttribute("aria-live", "assertive");
    toastDiv.setAttribute("aria-atomic", "true");

    toastDiv.innerHTML = `
    <div class="d-flex">
        <div class="toast-body">
            ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
            aria-label="Close"></button>
    </div>
    `
    toastContainerDiv.appendChild(toastDiv);

    const bsToast = new bootstrap.Toast(toastDiv);
    bsToast.show();
}

async function listDir(path) {
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "LISTSTATUS",
            path: path
        })
    });
    return response.json();
}

async function downloadFile(path, fileName) {
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "OPEN",
            path: path,
            file_name: fileName
        })
    });
    return response;
}

async function createDir(path, dirName) {
    if (currentDirs.includes(dirName)) {
        createToast("Directory already exists");
        return null;
    }
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "MKDIRS",
            path: path,
            dir_name: dirName
        })
    });
    return response.json();
}

async function renameFileDir(path, currentName, newName) {
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "RENAME",
            path: path,
            current_name: currentName,
            new_name: newName
        })
    });
    return response;
}

async function deleteFile(path, fileName) {
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "DELETEFILE",
            path: path,
            file_name: fileName
        })
    });
    return response;
}

async function deleteDir(path, dirName) {
    response = await fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "DELETEDIR",
            path: path,
            dir_name: dirName
        })
    });
    return response;
}

function showFilesDirs(fileList) {
    currentDirs = [];
    currentFiles = [];
    // Find the elements where the lists should be placed
    const folderContainer = document.getElementById("folders");
    const fileContainer = document.getElementById("files");

    // Holder for directories
    const listElemFolders = document.createElement("ul");
    listElemFolders.classList.add("list-group");

    // Holder for files
    const listElemFiles = document.createElement("ul");
    listElemFiles.classList.add("list-group");

    // Iterate over all received File Statuses
    fileList.forEach(element => {
        const itemElem = document.createElement("li");
        itemElem.classList.add("list-group-item");

        itemElem.isDeleting = false;

        if (element.type == "FILE") {
            const itemText = document.createTextNode(element.pathSuffix);
            itemElem.appendChild(itemText);
            itemElem.ondblclick = () => {
                const offcanvasDiv = document.createElement("div");
                offcanvasDiv.classList.add("offcanvas", "offcanvas-start");
                offcanvasDiv.setAttribute("tabindex", "-1");
                offcanvasDiv.setAttribute("data-bs-backdrop", "static");
                offcanvasDiv.id = "elementOffcanvas";

                const offHeaderDiv = document.createElement("div");
                offHeaderDiv.classList.add("offcanvas-header");

                const offTitleElem = document.createElement("input");
                offTitleElem.setAttribute("type", "text");
                offTitleElem.setAttribute("name", "fileName");
                offTitleElem.value = element.pathSuffix;

                offTitleElem.addEventListener("keydown", async (event) => {
                    if (event.key == "Enter" && document.activeElement === offTitleElem) {
                        renameResponse = await renameFileDir(path, element.pathSuffix, offTitleElem.value);
                        if (renameResponse.ok) {
                            const jsonRename = await renameResponse.json();
                            if (jsonRename.message) {
                                createToast(jsonRename.message);
                                const listResponse = await listDir(path);
                                showFilesDirs(listResponse);
                                checkBackButton();
                            } else {
                                createToast(jsonRename.error);
                            }
                        } else {
                            createToast("Error while renaming file");
                        }
                    }
                });

                const offCloseBtn = document.createElement("button");
                offCloseBtn.classList.add("btn-close");
                offCloseBtn.setAttribute("type", "button");
                offCloseBtn.setAttribute("data-bs-dismiss", "offcanvas");
                offCloseBtn.setAttribute("aria-label", "Close");

                const offBodyDiv = document.createElement("div");
                offBodyDiv.classList.add("offcanvas-body");

                const offSizeText = document.createElement("p");
                offSizeText.textContent = `File size: ${calculateSize(element.length)}`
                const offLastModifiedText = document.createElement("p");
                offLastModifiedText.textContent = `Last Modified: ${new Date(element.modificationTime)}`;

                offBodyDiv.append(offSizeText, offLastModifiedText);

                const offFileDownloadBtn = document.createElement("button");
                offFileDownloadBtn.textContent = "Download";
                offFileDownloadBtn.classList.add("btn", "btn-primary");

                offFileDownloadBtn.onclick = async () => {
                    response = await downloadFile(path, element.pathSuffix);
                    if (response.ok) {
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = blobUrl;
                        anchor.download = element.pathSuffix;
                        anchor.click();
                        URL.revokeObjectURL(blobUrl);
                    }
                };

                const offFileDeleteBtn = document.createElement("button");
                offFileDeleteBtn.textContent = "Delete";
                offFileDeleteBtn.classList.add("btn", "btn-danger");

                offBodyDiv.append(offFileDownloadBtn, offFileDeleteBtn);

                offHeaderDiv.append(offTitleElem, offCloseBtn);

                offcanvasDiv.append(offHeaderDiv, offBodyDiv);

                document.body.appendChild(offcanvasDiv);

                const offCanvas = new bootstrap.Offcanvas(offcanvasDiv);

                offFileDeleteBtn.onclick = async () => {
                    const deleteFileResponse = await deleteFile(path, element.pathSuffix);
                    if (deleteFileResponse.ok) {
                        const jsonDeleteFile = await deleteFileResponse.json();
                        if (jsonDeleteFile.message) {
                            offCanvas.hide();
                            createToast(jsonDeleteFile.message);
                            const listResponse = await listDir(path);
                            showFilesDirs(listResponse);
                            checkBackButton();
                        } else {
                            createToast(jsonDeleteFile.error);
                        }
                    } else {
                        createToast("Error while deleting file");
                    }
                }

                offcanvasDiv.addEventListener("hidden.bs.offcanvas", event => {
                    document.body.removeChild(offcanvasDiv);
                });

                offCanvas.show();
            }
        } else {
            const folderNameInputElem = document.createElement("input");

            folderNameInputElem.setAttribute("type", "text");
            folderNameInputElem.setAttribute("name", "folderName");
            folderNameInputElem.value = element.pathSuffix;

            folderNameInputElem.addEventListener("keydown", async (event) => {
                if (event.key == "Enter" && document.activeElement === folderNameInputElem) {
                    renameResponse = await renameFileDir(path, element.pathSuffix, folderNameInputElem.value);
                    if (renameResponse.ok) {
                        const jsonRename = await renameResponse.json();
                        if (jsonRename.message) {
                            createToast(jsonRename.message);
                        } else {
                            createToast(jsonRename.error);
                        }
                    }
                }
            });

            const folderDeleteBtn = document.createElement("button");
            folderDeleteBtn.textContent = "Delete";
            folderDeleteBtn.classList.add("btn", "btn-danger");

            folderDeleteBtn.onclick = async () => {
                if (folderDeleteBtn.textContent.includes("Delete")) {
                    itemElem.isDeleting = true
                    folderDeleteBtn.textContent = "Really?"
                    folderDeleteBtn.classList.remove("btn-danger");
                    folderDeleteBtn.classList.add("btn-warning");

                    const cancelDeleteElement = document.createElement("button");
                    cancelDeleteElement.textContent = "✘"
                    cancelDeleteElement.classList.add("btn", "btn-danger");

                    itemElem.appendChild(cancelDeleteElement);

                    cancelDeleteElement.onclick = () => {
                        itemElem.isDeleting = false;
                        folderDeleteBtn.textContent = "Delete"
                        folderDeleteBtn.classList.remove("btn-warning");
                        folderDeleteBtn.classList.add("btn-danger");
                        itemElem.removeChild(cancelDeleteElement);
                    }
                } else {
                    const deleteDirResponse = await deleteDir(path, element.pathSuffix);
                    if (deleteDirResponse.ok) {
                        const jsonDeleteDir = await deleteDirResponse.json();
                        if (jsonDeleteDir.message) {
                            createToast(jsonDeleteDir.message);
                            const listResponse = await listDir(path);
                            showFilesDirs(listResponse);
                            checkBackButton();
                        } else {
                            createToast(jsonDeleteDir.error);
                        }
                    } else {
                        createToast("Error while deleting file");
                    }
                }
            }

            itemElem.appendChild(folderNameInputElem);
            itemElem.appendChild(folderDeleteBtn);
            itemElem.ondblclick = async () => {
                if (!itemElem.isDeleting) {
                    addToPath(element.pathSuffix);
                    const response = await listDir(path);
                    showFilesDirs(response);
                    addBreadcrumb(element.pathSuffix);
                    checkBackButton();
                }
            }
        }

        // Add the list item in the appropriate list
        if (element.type == "FILE") {
            listElemFiles.appendChild(itemElem);
            currentFiles.push(element.pathSuffix);
        } else {
            listElemFolders.appendChild(itemElem);
            currentDirs.push(element.pathSuffix);
        }
    });

    // Add the list groups to the containers
    folderContainer.innerHTML = "";
    if (listElemFolders.childElementCount > 0) {
        folderContainer.appendChild(listElemFolders)
    }
    fileContainer.innerHTML = "";
    if (listElemFiles.childElementCount > 0) {
        fileContainer.appendChild(listElemFiles);
    }
}

async function main() {
    const addFolderBtn = document.getElementById("addFolderBtn");
    const addFileBtn = document.getElementById("addFileBtn");

    const folderNameContainer = document.getElementById("folderNameContainer");
    const fileNameContainer = document.getElementById("fileNameContainer");
    const fileUploadForm = document.getElementById("fileUploadForm");
    const folderNameInput = document.getElementById("folderNameInput");

    const folderNameSubmitBtn = document.getElementById("folderNameSubmit");

    const backButton = document.getElementById("backBtn");

    addFolderBtn.onclick = () => {
        if (folderNameContainer.style.display === "none") {
            folderNameContainer.style.display = "block";
        } else {
            folderNameContainer.style.display = "none";
        }
    }

    addFileBtn.onclick = () => {
        if (fileNameContainer.style.display === "none") {
            fileNameContainer.style.display = "block";
        } else {
            fileNameContainer.style.display = "none";
        }
    }

    document.addEventListener("mousedown", function (event) {
        if (!folderNameContainer.contains(event.target)) {
            folderNameContainer.style.display = "none";
        }
        if (!fileNameContainer.contains(event.target)) {
            fileNameContainer.style.display = "none";
        }
    });

    folderNameSubmitBtn.onclick = async () => {
        const folderName = folderNameInput.value.trim();
        if (folderName.length == 0) {
            createToast("Folder name can't be empty");
            return;
        }
        const response = await createDir(path, folderName);
        if (response != null) {
            if (response.message) {
                createToast(response.message);
            } else {
                createToast(response.error);
            }
        }
        const jsonResponse = await listDir(path);
        showFilesDirs(jsonResponse);
        checkBackButton();
    }

    fileUploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(fileUploadForm);
        let response;
        try {
            response = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "X-Path": path
                },
                body: formData
            });

            if (response.ok) {
                const jsonResponse = await response.json();
                if (jsonResponse.message) {
                    createToast(jsonResponse.message)
                } else {
                    createToast(jsonResponse.error)
                }
                const listResponse = await listDir(path);
                showFilesDirs(listResponse);
                checkBackButton();
            } else {
                createToast("Error while uploading the file.")
            }
        } catch (error) {
            console.log(error);
            createToast(error);
        }
    });

    backButton.onclick = async () => {
        if (path == "/") return;
        popFromPath();
        const response = await listDir(path);
        showFilesDirs(response);
        popBreadcrumb();
        checkBackButton();
    }

    const jsonResponse = await listDir(startPath);

    showFilesDirs(jsonResponse);
    checkBackButton();
}

main();
