let allPackages, currentPackages, cancellationToken, hiddenCount;
const triples = ["arm-uwp","arm64-windows","x64-linux","x64-osx","x64-uwp","x64-windows","x64-windows-static","x86-windows"];
let compatFilter = [];

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

// initialize query to result from index.html or blank
let query = getUrlParameter('query') || "";

$.getJSON('./output.json',  function(responseObject){
    allPackages = responseObject.Source;
    currentPackages = allPackages;
    document.getElementById("pkg-search").value = query;
    searchAndRenderPackages();
});


var renderCompability = function (pkg, packageDiv){
    var compatRowDiv = document.createElement('div')
    compatRowDiv.className = "package-compatibility"

    // Compatibility text
    var compatDiv = document.createElement('span')
    compatDiv.className = "package-compatibility-text"
    compatDiv.textContent = "Compatibility: "
    compatRowDiv.appendChild(compatDiv)

    // Display processor statuses
    let statusDiv = document.createElement('div');
    statusDiv.className = "processor-status";
    
    var iconDiv = document.createElement('img');
    iconDiv.className = "processor-status-icon";

    let compatRowFrag = document.createDocumentFragment();
    for (var t of triples){
        var procStatusDiv =statusDiv.cloneNode(true);
        var status = pkg[t];
        var simplifiedStatus = (status === "pass" || status === "fail") ? status : "unknown";
        procStatusDiv.classList.add(simplifiedStatus);

        // hide card if it doesn't pass the compatibility filter
        if (simplifiedStatus === "fail" && compatFilter.includes(t)){
            packageDiv.classList.add("hide")
            hiddenCount+=1;
            console.log(hiddenCount)
        }
        procStatusFrag = document.createDocumentFragment();
        procStatusIconDiv = iconDiv.cloneNode(true);
        procStatusIconDiv.setAttribute("alt", simplifiedStatus)
        procStatusIconDiv.setAttribute("src", "assets/" + simplifiedStatus + ".png")
        procStatusFrag.appendChild(procStatusIconDiv)

        var procStatusName = document.createElement('span');
        procStatusName.textContent = t;
        procStatusFrag.appendChild(procStatusName);

        procStatusDiv.appendChild(procStatusFrag);
        compatRowFrag.appendChild(procStatusDiv);
    }
    compatRowDiv.appendChild(compatRowFrag);
    return compatRowDiv;
}

function expandText (moreDescSpan, extraDescSpan){
    extraDescSpan.classList.remove("hide")
    moreDescSpan.className = "hide"
}

var renderPackages = function() {
    cancellationToken = new Object();
    clearPackages();
    hiddenCount = 0;
    // Parent div to hold all the package cards
    var mainDiv = document.getElementsByClassName("package-results")[0];
    
    if (currentPackages.length > 0) {
        let mainPackageFrag = document.createDocumentFragment();

        var parentPackageDiv = document.createElement('div')
        parentPackageDiv.className = "card package-card"
        parentPackageDiv.setAttribute("data-toggle", "modal")
        parentPackageDiv.setAttribute("data-target","#pkg-modal")

        var parentNameDiv = document.createElement('div')
        parentNameDiv.className = "package-name"

        var parentdescriptionDiv = document.createElement('div')
        parentdescriptionDiv.className = "package-description"

        var parentShortDescSpan = document.createElement('span')
        parentShortDescSpan.className = "package-description-short"

        var parentMoreDescSpan = document.createElement('span')
        parentMoreDescSpan.className = "package-description-more"

        var parentExtraDescSpan = document.createElement('span')
        parentExtraDescSpan.className = "hide"

        var parentCardFooterDiv = document.createElement('div')
        parentCardFooterDiv.className = "package-card-footer"

        var parentWebsiteLink = document.createElement('a')
        parentWebsiteLink.className = "package-website align-bottom"
        parentWebsiteLink.textContent = "Website"
        parentWebsiteLink.target = "_blank"

        var parentFullBtnSpan = document.createElement('span')
        parentFullBtnSpan.className = "github-btn"

        var parentGitHub = document.createElement('a')
        parentGitHub.className = "gh-btn"
        parentGitHub.target = "_blank"

        var parentBtnIcoSpan = document.createElement('span')
        parentBtnIcoSpan.className = "gh-ico"

        var parentBtnTxtSpan = document.createElement('span')
        parentBtnTxtSpan.className = "gh-text"
        parentBtnTxtSpan.textContent = "Star"

        var parentGitHubCount = document.createElement('a')
        parentGitHubCount.className = "gh-count"
        parentGitHubCount.target = "_blank"
        parentGitHubCount.style.display = 'block'
        
        var parentVersionDiv = document.createElement('div')
        parentVersionDiv.className = "package-version"

        function renderCard (package, oldCancellationToken){
            if (oldCancellationToken !== cancellationToken) return;
            // Div for each package
            var packageDiv = parentPackageDiv.cloneNode(true);
            packageDiv.addEventListener("click", updateModal.bind(this,package))
            packageDiv.setAttribute("data-details", package);
            let cardFrag = document.createDocumentFragment();

            // Package Name
            var nameDiv = parentNameDiv.cloneNode(true);
            nameDiv.textContent = package.Name
            cardFrag.appendChild(nameDiv)
            
            // Package Description (HTML version)
            let fullDesc = package.Description;
            let cutoff = 200; //character cut off
            if (fullDesc){
                var descriptionDiv = parentdescriptionDiv.cloneNode(true);
                var shortDescSpan = parentShortDescSpan.cloneNode(true);
                shortDescSpan.textContent = fullDesc.substring(0,cutoff);
                descriptionDiv.appendChild(shortDescSpan)

                let extraText = fullDesc.substring(cutoff);
                if (extraText){
                    var extraDescSpan = parentExtraDescSpan.cloneNode(true);
                    extraDescSpan.textContent = fullDesc.substring(cutoff);

                    var moreDescSpan = parentMoreDescSpan.cloneNode(true);
                    moreDescSpan.addEventListener("click",expandText.bind(this, moreDescSpan, extraDescSpan))
                    moreDescSpan.textContent = " More...";
                    descriptionDiv.appendChild(moreDescSpan);
                    descriptionDiv.appendChild(extraDescSpan);
                }
                cardFrag.appendChild(descriptionDiv)
            }
            // Package Processor Compatibilities
            cardFrag.appendChild(renderCompability(package, packageDiv))

            var totalPackags = document.getElementsByClassName("total-packages")[0]
            console.log("loading total packages: " +hiddenCount)
            totalPackags.textContent = "Total: " + (currentPackages.length-hiddenCount) + " Packages"

            var cardFooterDiv = parentCardFooterDiv.cloneNode(true);

            // Website link (with clause)
            var homepageURL = package.Homepage;
            if (homepageURL) {
                var websiteLink = parentWebsiteLink.cloneNode(true)
                websiteLink.href = homepageURL
                cardFooterDiv.appendChild(websiteLink)

                if (package.Stars){
                    var fullBtnSpan = parentFullBtnSpan.cloneNode(true)
                        var btnSpan = parentGitHub.cloneNode(true)
                        btnSpan.href = homepageURL
                            var btnIcoSpan = parentBtnIcoSpan.cloneNode(true)
                            var btnTxtSpan = parentBtnTxtSpan.cloneNode(true)
                            btnSpan.appendChild(btnIcoSpan)
                            btnSpan.appendChild(btnTxtSpan)
                        fullBtnSpan.appendChild(btnSpan)
                        var ghCount = parentGitHubCount.cloneNode(true)
                        ghCount.textContent = package.Stars
                        ghCount.setAttribute('aria-label', package.Stars)
                        ghCount.href = homepageURL
                    fullBtnSpan.appendChild(ghCount)
                    cardFooterDiv.appendChild(fullBtnSpan)
                }
            }

            // Package Version
            var versionDiv = parentVersionDiv.cloneNode(true)
            versionDiv.textContent =" Version: "+ package.Version
            cardFooterDiv.appendChild(versionDiv)

            cardFrag.appendChild(cardFooterDiv)

            // Add the package card to the page
            packageDiv.appendChild(cardFrag)
            mainDiv.appendChild(packageDiv)
        }

        for (var package of currentPackages) {
            setTimeout(renderCard.bind(this, package, cancellationToken),0);
        }

    } else {
        var noResultDiv = document.createElement('div')
        noResultDiv.className = 'card package-card'
        noResultDiv.innerHTML = "No results for " + '<b>' + query + '</b>'
        mainDiv.appendChild(noResultDiv)
    }
    
}

function clearPackages() {
    var mainDiv = document.getElementsByClassName("package-results")[0]
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild)
    }
}

function searchPackages(query){
    var options = {
        findAllMatches: true,
        threshold: 0.1,
        location: 0,
        distance: 100,
        maxPatternLength: 50,
        minMatchCharLength: 1,
        keys: [
          "Name",
          "Description"
        ]
      }
      var fuse = new Fuse(allPackages, options);
      var searchResult = fuse.search(query);
      var newPackagesList = [];
      for (var rslt of searchResult) {
          newPackagesList.push(rslt.item)
      }
      currentPackages = newPackagesList;
}

function searchAndRenderPackages() {
    query = document.getElementById("pkg-search").value.trim();
    if (query === '') {
        currentPackages = allPackages;
    } 
    else {
        searchPackages(query);
    }
    if (document.getElementById("sortBtn").value !== "Best Match"){
        sortPackages();
    }
    renderPackages();
}

const sortAlphabetical = function(a, b) {
    var pkgA = a.Name.toUpperCase();
    var pkgB = b.Name.toUpperCase();
    return pkgA >= pkgB ? 1 : -1
}

const sortStars = function(a,b){
    return (b.stars || 0) - (a.stars || 0);
}

function sortPackages(){
    let val = document.getElementById("sortBtn").value
    switch(val){
        case "Best Match":
            searchAndRenderPackages();
            break;
        case "Alphabetical":
            currentPackages.sort(sortAlphabetical);
            renderPackages();
            break;
        case "GitHub Stars":
            currentPackages.sort(sortStars);
            renderPackages();
            break;
    }
}

function filterCompat(){
    compatFilter = [...document.querySelectorAll(".compat-card input[type='checkbox']:checked")].map(e=> e.value);
    renderPackages();
}

function updateModal(pkg){
    console.log("updateModal")
    document.getElementById("pkg-modal-title").textContent = pkg.Name
}