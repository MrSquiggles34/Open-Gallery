function init(){
	document.getElementById("refresh").onclick = refreshSearch;
	document.getElementById("login").onclick = login;
}

function login(event){
	event.preventDefault();
	console.log("Get Log in page");
	window.location.href = "/login";
}

function register(){
	console.log("Get register page");
	window.location.href = "/register";
}

function setSearchQuery(query) {
    document.getElementById("searchQuery").value = query;
    setTimeout(refreshSearch, 100);
}

function refreshSearch(){
	console.log("Refresh Cards");
	
	xttp = new XMLHttpRequest();
	xttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
			console.log("Response Text: " + this.responseText);
			document.getElementById("results").innerHTML = this.responseText;
		}
	}

	queryString = document.getElementById("searchQuery").value;
	console.log("QueryString: " + queryString);
	
	xttp.open("GET", `/browse/search?${queryString}`);
	xttp.send();
}

function toggleComposeForm() {
    var composeFormContainer = document.getElementById('compose-form-container');
    var composeButton = document.querySelector('[onclick="toggleComposeForm()"]');

    // Hide/reveal compose form after checking if visible
    if (composeFormContainer.style.display === 'block') {
        composeFormContainer.style.display = 'none';
        composeButton.textContent = 'Compose';
    } else {
        composeFormContainer.style.display = 'block';
        composeButton.textContent = 'Cancel';
    }
}

function viewLikedPosts() {
	var likedPostsContainer = document.getElementById('liked-posts-container');
    var likedButton = document.querySelector('[onclick="viewLikedPosts()"]');

        // Hide/reveal liked form after checking if visible
    if (likedPostsContainer.style.display === 'block') {
        likedPostsContainer.style.display = 'none';
        likedButton.textContent = 'Liked';
    } else {
        likedPostsContainer.style.display = 'block';
        likedButton.textContent = 'Hide Liked';
    }
}

function viewCommentedPosts() {
	var commentedPostsContainer = document.getElementById('commented-posts-container');
    var commentedButton = document.querySelector('[onclick="viewCommentedPosts()"]');

       // Hide/reveal commented form after checking if visible
    if (commentedPostsContainer.style.display === 'block') {
        commentedPostsContainer.style.display = 'none';
        commentedButton.textContent = 'Commented';
    } else {
        commentedPostsContainer.style.display = 'block';
        commentedButton.textContent = 'Hide Comments';
    }
}

function viewFollowing() {
	var followingContainer = document.getElementById('following-container');
    var followingButton = document.querySelector('[onclick="viewFollowing()"]');

        // Hide/reveal following form after checking if visible
    if (followingContainer.style.display === 'block') {
        followingContainer.style.display = 'none';
        followingButton.textContent = 'Following';
    } else {
        followingContainer.style.display = 'block';
        followingButton.textContent = 'Hide Following';
    }
}

function likePost(artID) {
    const likeButton = document.getElementById('likeButton');  
    console.log(likeButton.innerText);
    const xttp = new XMLHttpRequest(); 
    xttp.onreadystatechange = function () {


        if (xttp.readyState === XMLHttpRequest.DONE) {
            console.log("inxml");
            if (xttp.status === 200) {
                if (likeButton.innerText === 'Like') {
                    console.log("changing like button");
                    likeButton.innerText = 'UnLike';
                } else {
                    likeButton.innerText = 'Like';
                    console.log("changing like button to like");
                }
            } else {
                console.error('Failed to like Post');
            }
        }
    };

    xttp.open('PUT', `/like/${artID}`);
    xttp.send();
}

function commentPost(artID) {
    const commentContent = document.getElementById('commentContent').value;
    const xttp = new XMLHttpRequest();

    xttp.onreadystatechange = function () {
        if (xttp.readyState === XMLHttpRequest.DONE) {
            if (xttp.status === 200) {
                console.log("posted comment");
                const newComment = JSON.parse(xttp.responseText).comment;

                // Create a new paragraph element for the new comment
                const newCommentParagraph = document.createElement('p');
                newCommentParagraph.textContent = newComment;

                // Append the new comment to the container
                const newCommentContainer = document.getElementById('newCommentContainer');
                newCommentContainer.appendChild(newCommentParagraph);

                // Clear the textarea
                document.getElementById('commentContent').value = '';
            } else {
                console.error('Failed to post comment');
            }
        }
    };

    var requestBody = JSON.stringify({ commentContent });
    xttp.open('PUT', `/comment/${artID}`);
    xttp.setRequestHeader('Content-Type', 'application/json');
    xttp.send(requestBody);
};


function toggleAccountType(artistID) {
    var composeFormContainer = document.getElementById('compose-form-container');
    var composeButton = document.getElementById('compose-button');
    if(composeFormContainer && composeButton != null)
    {
        composeFormContainer.style.display = 'none';
        composeButton.style.display = 'none';
    }

    fetch(`/switch`, { method: 'PUT' }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    })
    .catch(error => console.error('Error:', error));

}

function followArtist(artistID) {
    const followButton = document.getElementById('followButton');
    const xttp = new XMLHttpRequest();

    xttp.onreadystatechange = function () {
        if (xttp.readyState === XMLHttpRequest.DONE) {
            if (xttp.status === 200) {
                if (followButton.innerText === 'Follow') {
                    followButton.innerText = 'Unfollow';
                } else {
                    followButton.innerText = 'Follow';
                }
            } else {
                console.error('Failed to follow artist');
            }
        }
    };

    xttp.open('PUT', `/artists/${artistID}/follow`);
    xttp.send();
}