//#region no toca
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js';
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, deleteDoc, orderBy, query, limit, startAfter } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject  } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyA80RH7zeZ8gqOzyMF7zTeHwCsElIHRNyQ",
    authDomain: "html-firebase-test-b9c46.firebaseapp.com",
    projectId: "html-firebase-test-b9c46",
    storageBucket: "html-firebase-test-b9c46.appspot.com",
    messagingSenderId: "160048715488",
    appId: "1:160048715488:web:39bfa261939ff886866285"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const store = getFirestore();
//#endregion

// Elementi
const posts = document.querySelector("#posts");
const createForm = document.querySelector("#create-form");
const progressBar = document.querySelector("#progress-bar");
const progressBarHandler = document.querySelector("#progress-handler");
const postSubmitBtn = document.querySelector("#submit");
const openNav = document.querySelector("#open-nav");
const closeNav = document.querySelector("#close-nav");
const loading = document.querySelector("#loading");
const deleteBtn = document.querySelector("#delete")
const editBtn = document.querySelector("#edit")
const singlePost = document.querySelector("#post")
const editFormContainer = document.querySelector("#editFormContainer");
const pagination = document.querySelector("#pagination");

let currentTitle;
let currentId;
let currentContent;
let currentCover;
let lastVisible;
let postsSize;
let size;


// Globali
let editMode = false;
let postsArray = [];

const getPosts = async() =>{
    let docs;
    let postsRef = await query(collection(getFirestore(), "posts"), orderBy("title"), limit(10));


    let _size = await getDocs(collection(getFirestore(), "posts"));
    size = _size.size;
    await getDocs(postsRef).then(documentSnapshots =>{
        docs = documentSnapshots;
        console.log(docs);
        lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
        console.log("last", lastVisible);
    });
    docs["docs"].forEach(doc =>{
        postsArray.push({"id": doc.id, "data": doc.data()});
    });
    if(postsArray.length > 0){
        pagination.style.display = "block";
    }else{
        pagination.style.display = "none";
    }
    await createChildren(postsArray);
    postsSize = posts.childNodes.length;
}

const getPost = async() =>{
    if(loading != null){
        let postId = getPostIdFromURL();
        loading.innerHTML = "<div><div class='lds-dual-ring'><div></div></div><p>Loading Post...</p></div>";
            
        let post = await getDoc(doc(getFirestore(), "posts", postId)).catch(err =>{console.log(err)});

        currentId = post.id;
        currentContent = post.data().content;
        currentTitle = post.data().title;
        currentCover = post.data().fileref;

        loading.innerHTML = ""

        createChild(post.data());

    }
}

const getPostIdFromURL = () =>{
    let postLocation = window.location.href;
    let hrefArray = postLocation.split("#/");
    let postId = hrefArray[1];
    return postId;
}

const createChild = (data) =>{
    if(singlePost != null){
        let div = document.createElement("div");
        let img = document.createElement("img");
        img.setAttribute("src", data.cover);
        img.setAttribute("loading", "lazy");

        let title = document.createElement("h3");
        let titleNode = document.createTextNode(data.title);
        title.appendChild(titleNode);

        let content = document.createElement("div");
        content.appendChild(document.createTextNode(data.content));

        div.appendChild(img);
        div.appendChild(title);
        div.appendChild(content);
        singlePost.appendChild(div);
    }
}

const createChildren = async(arr) =>{
    if(posts != null){
        arr.map(post =>{
            let div = document.createElement("div");
            let cover = document.createElement("div");
            let anchor = document.createElement("a");
            let anchorNode = document.createTextNode(post.data.title);
            anchor.setAttribute("href", `post.html#/${post.id}`);

            anchor.appendChild(anchorNode);
            cover.style.backgroundImage = `url(${post.data.cover})`;
            div.classList.add("post");
            div.appendChild(cover);
            div.appendChild(anchor);
            posts.appendChild(div);
        });
    }
}

const appendEditForm = async() =>{
    let d;

    let form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.id = "editForm";

    let titleInput = document.createElement("input");
    titleInput.setAttribute("type", "text");
    titleInput.setAttribute("value", currentTitle);
    titleInput.id = "editTitle";

    let contentTextarea = document.createElement("textarea");
    contentTextarea.id = "editContent";
    
    let coverFile = document.createElement("input");
    coverFile.setAttribute("type", "file");
    coverFile.id = "editCover";
    
    let oldCover = document.createElement("input");
    oldCover.setAttribute("type", "hidden");
    oldCover.id = "oldCover";
    
    let submit = document.createElement("input");
    submit.setAttribute("value", "Update Post");
    submit.setAttribute("type", "submit");
    submit.id = "editSubmit";
    
    form.appendChild(titleInput);
    form.appendChild(contentTextarea);
    form.appendChild(coverFile);
    form.appendChild(oldCover);
    form.appendChild(submit);
    editFormContainer.appendChild(form);

    contentTextarea.value = currentContent;
    oldCover.value = currentCover;

    document.querySelector("#editForm").addEventListener("submit", async(e) =>{
        e.preventDefault();
        
        if(titleInput.value != "" && contentTextarea.value != ""){
            if(coverFile.files[0] !== undefined){
                const cover = coverFile.files[0];
                let coverName = await checkIfExists(cover.name);
                const storage = await ref(getStorage(), coverName);
                
                console.debug("Updating file...");

                const postCover = uploadBytesResumable(storage, cover);
                new Promise((resolve) =>{
                    postCover.on("state_changed", (snapshot) =>{
                        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(Math.trunc(progress));
    
                        if(progressBarHandler != null){
                            progressBarHandler.style.display = true;
                        }
                        if(postSubmitBtn != null){
                            postSubmitBtn.disabled = true;
                        }
                        if(progressBar != null){
                            progressBar.value = progress;
                        }
                    }, (error) =>{
                        console.log(error);
                    }, async() =>{
                        const downloadUrl = await getDownloadURL(postCover.snapshot.ref);
                        d = downloadUrl;
                        await deleteObject(ref(getStorage(), oldCover.value)).then(console.log("Previous Deleted!")).catch(err =>{
                            console.log(err);
                        })
                        const fileRef = await ref(getStorage(), d);
                        let post = {
                            title: titleInput.value,
                            content: contentTextarea.value,
                            cover: d,
                            fileref: fileRef.fullPath
                        }
                        console.log(post.fileref);

                        await setDoc(doc(getFirestore(), "posts", currentId), post);
                        resolve();
                        location.reload();
                    })
                });
            }else{
                await setDoc(doc(getFirestore(), "posts", currentId), {
                    title: titleInput.value,
                    content: contentTextarea.value
                }, {merge: true});
                location.reload();
            }
        }else{
            alert("You need to fill the inputs!!");
        }

    })
}

const removeEditForm = () =>{
    const editForm = document.getElementById("editForm");
    editFormContainer.removeChild(editForm);
}

const paginate = async() =>{
    let docs;
    let postsRef = query(collection(getFirestore(), "posts"), orderBy("title"), startAfter(lastVisible), limit(5));    
    
    await getDocs(postsRef).then(documentSnapshots =>{
        docs = documentSnapshots;
        
        lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
        docs["docs"].forEach(doc =>{
            let div = document.createElement("div");
            let cover = document.createElement("div");
            let anchor = document.createElement("a");
            let anchorNode = document.createTextNode(doc.data().title);
            anchor.setAttribute("href", `post.html#/${doc.id}`);

            anchor.appendChild(anchorNode);
            cover.style.backgroundImage = `url(${doc.data().cover})`;
            div.classList.add("post");
            div.appendChild(cover);
            div.appendChild(anchor);
            posts.appendChild(div);
            postsSize++;
        });
    });
    if(postsSize >= size){
        pagination.style.display = "none";
    }
}


//#region Salva Post

if(editBtn != null){
    if(document.cookie
        .split(';')
        .map(cookie => cookie.split('='))
        .reduce((accumulator, [key, value]) => ({ ...accumulator, [key.trim()]: decodeURIComponent(value) }), {}).admin == "true"){
            editBtn.addEventListener("click", () =>{
            if(!editMode){
                editMode = true;
                console.debug("Enabling Edit Mode");

                appendEditForm();
            }else{
                editMode = false;
                console.log("Disabling Edit Mode");

                removeEditForm();
            }
        })
        editBtn.style.display = "block";
    }else{
        editBtn.style.display = "none";
    }
}

const checkIfExists = async(fileName) =>{
    const reference = ref(getStorage(), fileName);
    return await getDownloadURL(reference).then(async() =>{
        let fileArray = fileName.split(".");
        fileArray[fileArray.length - 2] += Math.floor(Math.random() * 10) + ".";
        fileName = fileArray.reduce((acc, cur) =>{
            return acc + cur;
        }, "");
        return await checkIfExists(fileName)
    }).catch((e) =>{
        console.info(fileName);
        return fileName;
    })
}

if(createForm != null){
    let d;
    createForm.addEventListener("submit", async(e) => {
        e.preventDefault();
        if(document.getElementById("title").value != "" && document.getElementById("content").value != "" && document.getElementById("cover").files[0] != ""){

            let title = document.getElementById("title").value;
            let content = document.getElementById("content").value;
            let cover = document.getElementById("cover").files[0];

            let coverName = await checkIfExists(cover.name);

            const storageRef = getStorage(app);
            const storageChild = await ref(storageRef, coverName);
            const postCover = uploadBytesResumable(storageChild, cover);

            await new Promise((resolve) =>{
                postCover.on("state_changed", (snapshot) =>{
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(Math.trunc(progress));

                    if(progressBarHandler != null){
                        progressBarHandler.style.display = "block";
                    }
                    if(postSubmitBtn != null){
                        postSubmitBtn.disabled = true;
                    }
                    if(progressBar != null){
                        progressBar.value = progress;
                    }
                }, (error) =>{
                    console.log(error);
                }, async() =>{
                    const downloadUrl = await getDownloadURL(postCover.snapshot.ref);
                    d = downloadUrl;
                    resolve();
                })
            });
            const fileRef = await ref(getStorage(), d);
            let post = {
                title,
                content,
                cover: d,
                fileref: fileRef.fullPath
            }
            
            await setDoc(doc(collection(getFirestore(), "posts")), post);
            console.log("post added successfully");
            
            if(postSubmitBtn != null){
                window.location.replace("/");
                postSubmitBtn.disabled = false;
            }
        }else{
            alert("Must fill all the inputs!");
        }
    });
}

//#endregion

if(deleteBtn != null){
    if(document.cookie
        .split(';')
        .map(cookie => cookie.split('='))
        .reduce((accumulator, [key, value]) => ({ ...accumulator, [key.trim()]: decodeURIComponent(value) }), {}).admin == "true"){
        deleteBtn.addEventListener("click", async() =>{
            const storage = await deleteObject(ref(getStorage(), currentCover)).catch(err =>{console.log(err)});
            await deleteDoc(doc(getFirestore(), "posts", currentId));
    
            window.location.replace("/")
        });
        deleteBtn.style.display = "block";
    }else{
        deleteBtn.style.display = "none";
    }
}

if(pagination != null){
    pagination.addEventListener("click", async() =>{
        await paginate();
    })
}


// Check if the DOM is fully loaded
document.addEventListener("DOMContentLoaded", (e) =>{
    if(posts != null){
        getPosts();
    }
    getPost();
})

// Nav functions
openNav.addEventListener("click", (e) =>{
    document.querySelector("#nav").style.width = "250px";
    document.querySelector("#main").style.marginLeft = "260px";
});

closeNav.addEventListener("click", (e) =>{
    e.preventDefault();
    document.querySelector("#nav").style.width = "0px";
    document.querySelector("#main").style.marginLeft = "";
});