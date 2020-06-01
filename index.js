"use strict";
const fs = require('fs')
const Pdf2Canvas = require('pdf2canvas')
const { createWorker, createScheduler } = require('tesseract.js')

async function ocrService(){
	// Definições
	const searchPath = './ocr/'
	const output = './ocr/inOCR/'
	const workersNum = 2
	const schenduler = createScheduler()
	var working = false
	// Iniciar Workers
	for(let i=0;i<workersNum;i++){
		const worker = createWorker({
			logger: m => console.log(m)
		})
		await worker.load()
		await worker.loadLanguage('por')
		await worker.initialize('por')
		schenduler.addWorker(worker);
	}
	// Iniciar OCR
	searchPDFService(ocr)
	// Ler Pasta
	function searchPDFService(pdfFile){
		function isPDF(filename){
			if(filename) return filename.split('.').pop()=='pdf'
		}
		function search(){
			const files = fs.readdirSync(searchPath)
			const lastIndex = files.length
			let i=0
			for(;!isPDF(files[i]) && i<lastIndex;i++);
			if(files[i]){
				clearInterval(idle)
				console.log("Founded "+files[i])
				pdfFile(files[i])
			}
		}
		const idle = setInterval(search, 1000);
	}
	// Faz OCR do PDF
	async function ocr(pdfName){
		const pages = await pdfToImages(searchPath+pdfName)
		fs.renameSync(searchPath+pdfName,output+pdfName)
		const results = await Promise.all(pages.map(page => (
				schenduler.addJob('recognize',page)
		)))
		const textInPDF = []
		results.map(r => textInPDF.push(r.data.text))
		console.log(results[0])
		fs.writeFile(searchPath+pdfName.slice(0,-4)+'.txt',textInPDF.toString(),()=>searchPDFService(ocr))
	}
	// Carregar PDFs em fila
	async function pdfToImages(pdfPath){
		const pdfCanvas = new Pdf2Canvas(pdfPath)
		let pages = await pdfCanvas.toDataURL({
			viewportScale: 1.4,
			quality: 1,
		})
		const pageCount = pages.length
		for(let i=0;i<pageCount;i++){
			pages[i] = pages[i].substr(22)
			pages[i] = Buffer.from(pages[i],'base64')
		}
		return pages
	}
	
}

ocrService()