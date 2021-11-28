//#region no toca
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js';
import { getFirestore, doc, setDoc, collection, getDocs, getDoc } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-firestore.js';
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

// Globali
let editMode = false;

const getPosts = async() =>{
    let postsArray = [];
    let docs = await getDocs(collection(getFirestore(), "posts")).catch(err => console.log(error));
    docs.forEach(doc =>{
        postsArray.push({"id": doc.id, "data": doc.data()});
    });

    createChildren(postsArray);
}

const getPost = async() =>{
    if(loading != null){
        let postId = getPostIdFromURL();
        loading.innerHTML = "<div><div class='lds-dual-ring'><div></div></div><p>Loading Post...</p></div>";
            
        let post = await getDoc(doc(getFirestore(), "posts", postId)).catch(err =>{console.log(err)});
        loading.innerHTML = ""
        if(post && deleteBtn != null){
            deleteBtn.style.display = "block";
        }
        if(post && deleteBtn != null){
            editBtn.style.display = "block";
        }

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

const createChildren = (arr) =>{
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
    let postId = getPostIdFromURL();
    let post = await getDoc(doc(getFirestore(), "posts", postId)).catch(err =>{console.error(err)});
    let d;

    let form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.id = "editForm";

    let titleInput = document.createElement("input");
    titleInput.setAttribute("type", "text");
    titleInput.setAttribute("value", post.data().title);
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

    contentTextarea.value = post.data().content;
    oldCover.value = post.data().fileref;

    document.querySelector("#editForm").addEventListener("submit", async(e) =>{
        e.preventDefault();
        
        const postId = await getPostIdFromURL();
        if(titleInput.value != "" && contentTextarea.value != ""){
            if(coverFile.files[0] !== undefined){
                const cover = coverFile.files[0];
                const storage = ref(getStorage(), cover.name);
                
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
                        console.log(d);
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

                        await setDoc(doc(getFirestore(), "posts", postId), post);
                        resolve();
                        location.reload();
                    })
                });
            }else{
                await setDoc(doc(getFirestore(), "posts", postId), {
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

if(editBtn != null){
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
}

//#region Salva Post

if(createForm != null){
    let d;
    createForm.addEventListener("submit", async(e) => {
        e.preventDefault();
        if(document.getElementById("title").value != "" && document.getElementById("content").value != "" && document.getElementById("cover").files[0] != ""){

            let title = document.getElementById("title").value;
            let content = document.getElementById("content").value;
            let cover = document.getElementById("cover").files[0];

            const storageRef = getStorage(app);
            const storageChild = ref(storageRef, cover.name);
            
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
                    console.log(d);
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
                window.location.replace("index.html");
                postSubmitBtn.disabled = false;
            }
        }else{
            console.log("Must fill all the inputs!");
        }
    });
}

//#endregion

// Check if the DOM is fully loaded
document.addEventListener("DOMContentLoaded", (e) =>{
    getPosts();
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