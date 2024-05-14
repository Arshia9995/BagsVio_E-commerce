

function validateUserName(){
    const usernamePattern=/^[a-zA-Z][a-zA-Z0-9_\s]{3,20}$/
    const name=document.getElementById('username').value;
    const msg=document.getElementById('nameCheck');
    if(usernamePattern.test(name)){
        msg.innerHTML=''
        return true
    }else{
        
        msg.innerHTML='Username must be 3-20 characters starts with a letter and only letters,digits, spaces inside and usnderscore permitted '
    }
}

function validateUserEmail() {
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z\s]{2,4}$/;
    var email = document.getElementById("email").value;
    var msg = document.getElementById("emailCheck");
    if (emailPattern.test(email)) {
        msg.innerHTML = "";
        return true
    } else {
        msg.innerHTML = "Invalid email address";
    }
    }
     
      function validatePassword() {
        var msg=document.getElementById("messagePwd")
        var password = document.getElementById("password").value;
        var regex = /^(?=.*[A-Za-z\s])(?=.*\d)(?=.*[@&!#^%])[A-Za-z\d@*&!#^%]{8,20}$/ 
        if (regex.test(password)) {
            console.log('inside validate')
            msg.innerHTML="" 
           return true          
        } else {
            console.log('inside else of validate')
            msg.innerHTML="Password is invalid. It should contain at least 8 character and must consist  of atleast one letters,numbers,and special character"
           return false;
        }
        
        }
         
          function checkPasswordMatch() {
            var password = document.getElementById("password").value;
            var confirmPassword = document.getElementById("confirm-password").value;
            var msg = document.getElementById("messagePwdMatch");           
            if (password === confirmPassword) {
            msg.innerHTML = "" 
            return true        
            } else {
            msg.innerHTML = "Passwords do not match. Please try again."            
            }
            }