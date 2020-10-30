/* For storing the gadget and import map */
window.gadgetMap = [];
window.basicImportMap = [];

/* All function stubs / imports from other modules */
var generateBasicImportMap = function()
{
  window.basicImportMap =
  {
    '2.57':
    {
      'setjmp':            getGadget('libSceWebKit2', 0x2C8),     // setjmp imported from libkernel, ported
      '__stack_chk_fail': getGadget('libSceWebKit2', 0x277CF70),//ported
    }
  };
}

/* All gadgets from the binary of available modules */
var generateGadgetMap = function()
{
  window.gadgetMap =
  {
    '2.57':
    {
      'pop rsi':  getGadget('libSceWebKit2', 0x1EC10E),//
      'pop rdi':  getGadget('libSceWebKit2', 0x89064),//
      'pop rax':  getGadget('libSceWebKit2', 0x10FFB),//
      'pop rcx':  getGadget('libSceWebKit2', 0x3779D0),//
      'pop rdx':  getGadget('libSceWebKit2', 0x171A),//
      'pop r8':   getGadget('libSceWebKit2', 0x32750D),//
      'pop r9':   getGadget('libSceWebKit2', 0x1383EEF),//
      'pop rsp':  getGadget('libSceWebKit2', 0x487F0),//

      'push rax': getGadget('libSceWebKit2', 0x10A382),//

      'add rax, rcx': getGadget('libSceWebKit2', 0x5DBD6),//

      'mov rax, rdi':             getGadget('libSceWebKit2', 0x3233),//
      'mov qword ptr [rdi], rax': getGadget('libSceWebKit2', 0xDE554),//
      'mov qword ptr [rdi], rsi': getGadget('libSceWebKit2', 0x2D6090),//

      'mov rax, qword ptr [rax]': getGadget('libSceWebKit2', 0x3C9C2),//

      'jmp addr': getGadget('libSceWebKit2', 0x116CBB4),//

      'infloop': getGadget('libSceWebKit2', 0x52A80),//??
      'jmp rax': getGadget('libSceWebKit2', 0x11D329),//
      'push rax; jmp rcx': getGadget('libSceWebKit2', 0x469B80),//not ported

      'ret': getGadget('libSceWebKit2', 0xC7),//
      'syscall': getGadget('libSceWebKit2', 0x1C96AE8),//
    }
  };
}
