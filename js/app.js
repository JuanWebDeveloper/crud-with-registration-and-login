// Firebase Connection To Authentication.
const auth = firebase.auth();
// Firebase Connection To Firestore.
const store = firebase.firestore();

// Forms.
const signUpForm = document.querySelector('#signUpForm');
const signInForm = document.querySelector('#signInForm');
// Registration Email And Password.
const signUpEmail = signUpForm.querySelector('#signUpEmail');
const signUpPassword = signUpForm.querySelector('#signUpPassword');
// Login Email And Password.
const signInEmail = signInForm.querySelector('#signInEmail');
const signInPassword = signInForm.querySelector('#signInPassword');
// Logout.
const logout = document.querySelector('#logout');
// logout Content.
const logoutContent = document.getElementById('logoutContent');
// Error Messages.
const errorSignUp = signUpForm.querySelector('#errorSignUp');
const errorSignIn = signInForm.querySelector('#errorSignIn');
// Navigation Items. 
const navigation = document.getElementById('navigation');
const items = navigation.querySelectorAll('li');
// Proof Of Valid Email.
const validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
// Form Validation Voucher Complete.
let fullValidation = false;
let relod = false;

// User Task List.
const userTaskList = document.querySelector('#userTaskList');
const taskForm = userTaskList.querySelector('#taskForm');
const taskContainer = userTaskList.querySelector('#taskContainer');
let editStatus = false;
let id = "";

// Functions

// Function To Add And Remove Error Messages.
const addAndRemoveMessages = (element, error) => {
    // Add Message
    error.classList.add('show'); 
    element.classList.add('inputError');

    // Remove Message
    element.addEventListener('focus', () => {
        error.classList.remove('show'); 
        element.classList.remove('inputError');
    });
}

// Function To Save User Tasks.
const saveTask = async (collectionName, title, description) => await store.collection(collectionName).doc().set({title, description});

// Function To Load User Tasks.
const loadTasks = async collectionName => await store.collection(collectionName).get();

// Function To Update Every Time A Task Is Added.
const onGetTasks = (collectionName, callback) => store.collection(collectionName).onSnapshot(callback)

// Function To Delete Tasks.
const deleteTask = async (collectionName, id) => await store.collection(collectionName).doc(id).delete(); 

// Function To Select The Task To Edit.
const getTaskEdit = (collectionName, id) => store.collection(collectionName).doc(id).get();

// Function To Edit Tasks.
const updateTask = async (collectionName, id, updateTask) => await store.collection(collectionName).doc(id).update(updateTask)

// Events.

// Register Users.
signUpForm.addEventListener('submit', e => {
    e.preventDefault();
    relod = false;
    // Validate Form.
    if (signUpEmail.value == "") {
        // Validating That The Email Field Is Not Empty.
        errorSignUp.innerText = "Write an email to continue";
        addAndRemoveMessages(signUpEmail, errorSignUp);
    } else if (!validEmail.test(signUpEmail.value)) {
        // Validating That The Email Is Valid.
        errorSignUp.innerText = "This email is not valid";
        addAndRemoveMessages(signUpEmail, errorSignUp);
    } else if (signUpPassword.value == "") {
        // Validating That The Password Field Is Not Empty.
        errorSignUp.innerText = "Enter a password";
        addAndRemoveMessages(signUpPassword, errorSignUp);
    } else if (signUpPassword.value.length < 7) {
        // Validating That The Password Has More Than 6 Characters.
        errorSignUp.innerText = "The password must have more than 6 characters";
        addAndRemoveMessages(signUpPassword, errorSignUp);
    } else {
        fullValidation = true;
    }

    // Sending The Data To Firebase.
    auth.createUserWithEmailAndPassword(signUpEmail.value, signUpPassword.value).then(userCredential => {
        signUpForm.reset();
        $('#signUpModal').modal('hide');
        if (!relod) {
            location.href = location.href;
            relod = true;
        }
    }).catch(error => {
        // We Notify The User That The Email They Are Trying To Register Is Already In Use.
        if (fullValidation) {
            errorSignUp.innerText = error.message;
            addAndRemoveMessages(signUpEmail, errorSignUp);
            fullValidation = false;
        }
    });
});

// Logging In
signInForm.addEventListener('submit', e => {
    e.preventDefault();
    relod = false;
    // Validate Form.
    if (signInEmail.value == "") {
        errorSignIn.innerText = "Enter Email";
        addAndRemoveMessages(signInEmail, errorSignIn);
    } else if (!validEmail.test(signInEmail.value)) {
        errorSignIn.innerText = "This email is not valid";
        addAndRemoveMessages(signInEmail, errorSignIn);
    } else if(signInPassword.value == "") {
        errorSignIn.innerText = "Enter Password To Login";
        addAndRemoveMessages(signInPassword, errorSignIn);
    } else {
        fullValidation = true;
    }

    // We Started Session.
    auth.signInWithEmailAndPassword(signInEmail.value, signInPassword.value).then(userCredential => {
        signInForm.reset();
        $('#signInModal').modal('hide');
        if (!relod) {
            location.href = location.href;
            relod = true;
        }
    }).catch(error => {
        // We Notify The User Of The Error That Arose.
        if (fullValidation) {
            errorSignIn.innerText = error.message;
            if (signInPassword.value.length > 1) {
                addAndRemoveMessages(signInPassword, errorSignIn);
            } else {
                addAndRemoveMessages(signInEmail, errorSignIn);
            }

            fullValidation = false;
        }
    });
});

// Closing Session.
logout.addEventListener('click', e => {
    e.preventDefault();
    auth.signOut().then(() => console.log('sign out'));
});

// We Check If The Session Is Active.
auth.onAuthStateChanged(user => {
    if (user) {
        // If The Session Is Active We Only Leave The Button To Close Session In The Navigation.
        for (let i = 0; i <= 2; i++) {
            items[i].classList.add('active');
        }
        userTaskList.classList.add('active');
        logoutContent.classList.add('active');
        const collectionName = user.email;

        // We Bring The Users Tasks.
        onGetTasks(collectionName, (tasks) => {
            taskContainer.innerHTML = "";

            tasks.forEach(task => {
                const doc = task.data();
                doc.id = task.id;


                taskContainer.innerHTML += `
                    <div class="card card-body mt-2 cardsSingle">
                        <h3>${doc.title}</h3>
                        <p>${doc.description}</p>
                        <div>
                            <button class="btn btn-danger btnDelete" data-id="${doc.id}">Delete <i class="fas fa-trash-alt"></i></button>
                            <button class="btn btn-primary btnEdit" data-id="${doc.id}">Edit <i class="fas fa-edit"></i></button>
                        </div>
                    </div>`;

                // Delete Tasks.
                const btnDelete = document.querySelectorAll('.btnDelete');
                btnDelete.forEach(btn => {
                    btn.addEventListener('click', e => {
                        deleteTask(collectionName, e.target.dataset.id)
                    });
                });

                // Edit Tasks.
                const btnEdit = document.querySelectorAll('.btnEdit');
                btnEdit.forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const docEdit = await getTaskEdit(collectionName, e.target.dataset.id);
                        const task = docEdit.data();
                        editStatus = true;
                        id = e.target.dataset.id;
                        taskForm['taskTitle'].value = task.title;
                        taskForm['taskDescription'].value = task.description;
                        taskForm['btnTask'].innerHTML = "Update";
                    });
                });
            });
        });

        // Event To Send The Task To Firebase.
        taskForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const title = taskForm['taskTitle'].value;
            const description = taskForm['taskDescription'].value;

            if (!editStatus) {
                saveTask(collectionName, title, description);
            } else {
                updateTask(collectionName, id, {title, description});
                editStatus = false;
                id = "";
                taskForm['btnTask'].innerHTML = "Save";
            }

            loadTasks(collectionName);
            taskForm.reset();
            taskForm['taskTitle'].focus();
        });

    } else {
        // If The Session Is Not Active We Leave All The Elements In The Navigation Except The One To Close The Session.
        for (let i = 0; i <= 2; i++) {
            items[i].classList.remove('active');
        }
        userTaskList.classList.remove('active');
        logoutContent.classList.remove('active');
        console.log("Logaut User");
    }
});