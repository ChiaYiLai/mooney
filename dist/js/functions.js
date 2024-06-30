export function dateString(d=new Date()) {
    const yyyy = d.getFullYear()
    const MM = `0${d.getMonth() + 1}`.slice(-2)
    const dd = `0${d.getDate()}`.slice(-2)
    return `${yyyy}-${MM}-${dd}`
}

export function notice(text, type='error', timeout=3000) {
    new Noty({ text, type, timeout, layout: 'bottomCenter', theme: 'semanticui', progressBar: false }).show()
}

export function isValidDate(d) {
    return d instanceof Date && !isNaN(d)
}
