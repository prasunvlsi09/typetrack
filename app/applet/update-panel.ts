import fs from 'fs';

let content = fs.readFileSync('src/components/PanelModal.tsx', 'utf-8');

const targetContent = `            {activeTab === 'scripts' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Scripts Management</h3>
                <p className={\`text-sm \${isLight ? 'text-black/60' : 'text-white/60'}\`}>
                  Manage system scripts and automated tasks here.
                </p>
                <div className={\`p-8 rounded-2xl border border-dashed flex items-center justify-center \${isLight ? 'border-black/20 text-black/40' : 'border-white/20 text-white/40'}\`}>
                  No active scripts running.
                </div>
              </div>
            )}`;

const replacementContent = `            {activeTab === 'scripts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Scripts Management</h3>
                  <p className={\`text-sm \${isLight ? 'text-black/60' : 'text-white/60'}\`}>
                    Execute system scripts and automated tasks here.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* /disable */}
                  <div className={\`p-4 rounded-xl border \${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}\`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-red-500 text-lg">/disable</div>
                        <div className={\`text-sm mt-1 \${isLight ? 'text-black/70' : 'text-white/70'}\`}>
                          Disables someone's account (practically banning them until you click /enable).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="User Email or ID" 
                          className={\`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-red-500 transition-colors \${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }\`}
                        />
                        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap">
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /enable */}
                  <div className={\`p-4 rounded-xl border \${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}\`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-emerald-500 text-lg">/enable</div>
                        <div className={\`text-sm mt-1 \${isLight ? 'text-black/70' : 'text-white/70'}\`}>
                          Enables a disabled account. Only works if they have been disabled.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="User Email or ID" 
                          className={\`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-emerald-500 transition-colors \${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }\`}
                        />
                        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap">
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /message */}
                  <div className={\`p-4 rounded-xl border \${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}\`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-blue-500 text-lg">/message</div>
                        <div className={\`text-sm mt-1 \${isLight ? 'text-black/70' : 'text-white/70'}\`}>
                          Pops up a message for whatever you type in to everybody.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="Type message here..." 
                          className={\`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-blue-500 transition-colors \${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }\`}
                        />
                        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap">
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

content = content.replace(targetContent, replacementContent);
fs.writeFileSync('src/components/PanelModal.tsx', content);
console.log('Done updating PanelModal');
