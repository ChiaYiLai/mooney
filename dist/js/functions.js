export function getToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const m = d.getMonth() + 1;
    const MM = `0${d.getMonth() + 1}`.slice(-2);
    const dd = `0${d.getDate()}`.slice(-2);
    return `${yyyy}-${MM}-${dd}`;
}

export function notice(text, type='error', timeout=5000) {
    new Noty({ text, type, timeout }).show();
}
