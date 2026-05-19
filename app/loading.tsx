export default function Loading() {
  return (
    <div className="px-[clamp(16px,4vw,56px)] py-8">
      <div className="skeleton w-full mb-8" style={{height:'min(90vh,700px)',borderRadius:'0'}} />
      {[1,2,3].map(s=>(
        <div key={s} className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="skeleton w-7 h-7 rounded-lg" />
            <div className="skeleton h-5 w-36 rounded" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({length:7},(_,i)=>(
              <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden" style={{width:'clamp(128px,15vw,176px)'}}>
                <div className="skeleton w-full" style={{aspectRatio:'2/3'}} />
                <div className="px-2.5 py-2 space-y-1.5">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-3/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
