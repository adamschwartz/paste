const ellipsizeStr = (str, len) => {
  if (str.length <= len)
    return str

  else
    return str.substr(0, len - 3) + '...'
}

const ellipsizeDataURL = (str) => {
  return ellipsizeStr(str, 400)
}


const getTypeFromString = (str) => {
  if (str.indexOf('<?xml version="1.0"') === 0 && str.indexOf('<svg') >= 0 && str.indexOf('<!-- Generator: Sketch') >= 0 && str.indexOf('<desc>Created with Sketch.</desc>') >= 0)
    return 'text/sketch-svg'

  if (str.indexOf('<?xml version="1.0"') === 0 && str.indexOf('<svg') >= 0)
    return 'text/svg'

  if (str[0] === '<' && str[str.length - 1] === '>') // TODO - be smarter
    return 'text/html'

  // TODO - handle HTML/CSS/JS and other special types of files

  return 'text/plain'
}

const cleanSketchSVG = (str) => {
  str = cleanSVG(str)
  str = str.replace(/<!-- Generator: Sketch (.+?)\- http:\/\/www\.bohemiancoding\.com\/sketch -->\n?/, '')
  return str
}

const cleanSVG = (str) => {
  str = str.replace(/<\?xml(.+?)\?>\n?/, '')
  str = str.replace(' version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"', '')
  str = str.replace(/ ?version\=\"1\.1\" ?/, '')
  str = str.replace(/ ?xmlns\=\"http\:\/\/www\.w3\.org\/2000\/svg\" ?/, '')
  str = str.replace(/ ?xmlns\:xlink\=\"http\:\/\/www\.w3\.org\/1999\/xlink\" ?/, '')
  str = str.replace(/<!--(.+?)-->\n?/, '')
  str = str.replace(/<title>(.+?)<\/title>\n?/, '')
  str = str.replace(/<desc>(.+?)<\/desc>\n?/, '')
  return str
}

const createNewPasteEl = (type) => {
  const el = document.querySelector(`.templates .paste.${ type }`).cloneNode(true)
  document.querySelector('.results').prepend(el)
  return el
}

const handleImage = (item) => {
  const blob = item.getAsFile()
  const reader = new FileReader()

  reader.onload = (event) => {
    const dataURL = event.target.result
    const el = createNewPasteEl('image')
    const originalEl = el.querySelector('.original')
    const textareaEl = el.querySelector('.converted .textarea')
    const copyInput = el.querySelector('.converted input.copy-input')
    const actionsEl = el.querySelector('.actions')

    const img = new Image()
    img.src = dataURL
    originalEl.appendChild(img)

    textareaEl.textContent = ellipsizeDataURL(dataURL)

    const openLink = document.createElement('a')
    openLink.href = dataURL
    openLink.textContent = 'Open'
    actionsEl.appendChild(openLink)

    const copyLink = document.createElement('a')
    copyLink.href = dataURL
    copyLink.textContent = 'Copy'
    actionsEl.appendChild(copyLink)

    const copy = (event) => {
      event.preventDefault()

      copyInput.value = dataURL
      copyInput.select()

      try {
        document.execCommand('copy')
        // TODO - success message
        copyInput.blur()
      }

      catch (err) {
        console.error('Could not run document.execCommand(\'copy\')')
      }
    }

    copyLink.addEventListener('click', copy)
    copyInput.addEventListener('click', copy)

    // console.log(blob.name || 'Pasted image', blob.size, blob.type, img.width, img.height) // TODO

    el.classList.add('done')
  }

  reader.readAsDataURL(blob)
}

const handleData = (item) => {
  const blob = item.getAsFile()
  const reader = new FileReader()

  reader.onload = (event) => {
    const dataURL = event.target.result
    const el = createNewPasteEl('data')
    const textareaEl = el.querySelector('.textarea')
    const actionsEl = el.querySelector('.actions')

    textareaEl.textContent = ellipsizeDataURL(dataURL)

    const openLink = document.createElement('a')
    openLink.href = dataURL
    openLink.textContent = 'Open'
    actionsEl.appendChild(openLink)

    // console.log(blob.name || 'Pasted data', blob.size, blob.type) // TODO

    el.classList.add('done')
  }

  reader.readAsDataURL(blob)
}

const handleText = (item) => {
  const type = item.type

  item.getAsString((str) => {
    if (type === 'text/html') {
      handleTextStr(str, 'text/html')
    }

    // TODO - handle other text/types

    else {
      handleTextStr(str)
    }
  })
}

const handleTextFile = (item) => {
  const blob = item.getAsFile()
  const reader = new FileReader()

  reader.onload = (event) => {
    handleTextStr(reader.result)
  }

  reader.readAsText(blob)
}

handleTextStr = (str, type) => {
  // TODO - better way?
  if (!type) {
    type = getTypeFromString(str)
  }

  let convertedStr = str

  switch (type) {
    case 'text/sketch-svg':
      convertedStr = cleanSketchSVG(str)
      // TODO - prettify

    case 'text/svg':
      convertedStr = cleanSVG(str)
      // TODO - prettify

    // case 'text/html':
    //   // convertedStr = cleanHTML(str) // TODO - implement
    //   // TODO - prettify

    // case 'text/plain':
    //   // TODO

    // default
    //   // TODO
  }

  if (type === 'text/html') {
    const el = createNewPasteEl('html')
    const iframeEl = el.querySelector('iframe')
    const textareaEl = el.querySelector('.textarea')

    iframeEl.contentDocument.documentElement.innerHTML = convertedStr
    textareaEl.textContent = convertedStr

    // TODO
    // let blob = item.getAsFile()
    // console.log(blob.name || 'Pasted text', str.length)

    el.classList.add('done')
  }

  else {
    const el = createNewPasteEl('text')

    el.querySelector('.original .textarea').textContent = str
    el.querySelector('.converted .textarea').textContent = convertedStr

    // TODO
    // let blob = item.getAsFile()
    // console.log(blob.name || 'Pasted text', str.length)

    el.classList.add('done')
  }
}

const handleEvents = (event) => {
  event.preventDefault()

  const items = (event.clipboardData || event.dataTransfer).items

  // TODO - use readAsBinaryString && readAsArrayBuffer?

  Array.prototype.forEach.call(items, (item) => {
    if (item.kind === 'file' && item.type.match('^image/')) {
      // TODO - unify this with other SVG detection since currently something could make it past this but then fail in getTypeFromString
      if (item.type.match('^image/svg')) {
        handleTextFile(item)
      }

      handleImage(item)
    }

    else if (item.kind === 'file' && item.type.match('^text/plain')) {
      handleTextFile(item)
    }

    //else if.. // handle other special file kinds

    else if (item.kind === 'file') {
      handleData(item)
    }

    else if (item.kind === 'string') {
      handleText(item)
    }
  })

  document.querySelector('h1').style.display = 'none' // TODO - fade out?
}

window.addEventListener('paste', handleEvents)

document.addEventListener('drag', (event) => event.preventDefault())
document.addEventListener('dragover', (event) => event.preventDefault())
document.addEventListener('drop', handleEvents)
