
module.exports = function (url, popstate) {
    var finalPage = null

    // scrolling
    if (this.options.doScrollingRightAway && !this.scrollToElement) {
        this.doScrolling(popstate)
    }

    let animationPromises = []

    if (!popstate) {
        // start animation
        document.documentElement.classList.add('is-changing')
        document.documentElement.classList.add('is-leaving')
        document.documentElement.classList.add('to-' + this.classify(url))

        // animation promise
        let animationPromise = this.createAnimationPromise(this.getAnimation(this.transition, this.animations, 'out'))
        animationPromises.push(animationPromise)

        Promise
            .all(animationPromises)
            .then(() => {
                this.triggerEvent('animationOutDone')
        })

        // create pop element with or without anchor
        if (this.scrollToElement != null) {
            var pop = url + this.scrollToElement;
        } else {
            var pop = url;
        }
        this.createState(pop)
    } else {
        // proceed without animating
        this.triggerEvent('animationSkipped')
    }

    if (this.cache.exists(url)) {
        var xhrPromise = new Promise(resolve => {
            resolve()
        })
        this.triggerEvent('pageRetrievedFromCache')
    } else {
        if (!this.preloadPromise || this.preloadPromise.route != url) {
            var xhrPromise = new Promise(resolve => {
                this.getPage(url, response => {
                    if (response === null) {
                        console.warn('Server error.')
                        this.triggerEvent('serverError')
                        this.goBack()
                    } else {
                        // get json data
                        var page = this.getDataFromHtml(response)
                        page.url = url
                        // render page
                        this.cache.cacheUrl(page, this.options.debugMode)
                        this.triggerEvent('pageLoaded')
                    }
                    resolve()
                })
            })
        } else {
            var xhrPromise = this.preloadPromise
        }
    }

    Promise
        .all(animationPromises.concat([xhrPromise]))
        .then(() => {
            finalPage = this.cache.getPage(url)
            if (!this.options.cache) {
                this.cache.empty(this.options.debugMode)
            }
            this.renderPage(finalPage, popstate)
            this.preloadPromise = null
        })
}