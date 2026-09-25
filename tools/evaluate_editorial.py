"""Document-level rule evaluation. Requires explicit independent labels and split groups.
No authorship accuracy is inferred from editorial labels or synthetic fixtures.
"""
import argparse
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.detector import AIDetector


def evaluate(rows, split='test'):
    groups, hashes, ids = {}, {}, set()
    for row in rows:
        for required in ['id', 'group', 'split', 'text', 'expected_rules', 'provenance']:
            if required not in row:
                raise ValueError(f'Missing {required}')
        if row['id'] in ids:
            raise ValueError('Duplicate document ID')
        ids.add(row['id'])
        digest=hashlib.sha256(row['text'].encode()).hexdigest()
        for mapping, key in [(groups,row['group']), (hashes,digest)]:
            if key in mapping and mapping[key] != row['split']:
                raise ValueError('Leakage: a group or duplicate text appears across splits')
            mapping[key]=row['split']
    selected=[r for r in rows if r['split']==split]
    if not selected:
        raise ValueError('No documents in selected split')
    counts=defaultdict(lambda: {'tp':0,'fp':0,'fn':0})
    outcomes=[]
    for row in selected:
        report=AIDetector().analyze_document(row['text'])
        actual={f['rule'] for f in report.get('findings',[])}
        expected=set(row['expected_rules'])
        for rule in actual|expected:
            counts[rule]['tp' if rule in actual&expected else 'fp' if rule in actual else 'fn']+=1
        outcomes.append({'id':row['id'],'status':report['status'],'unexpected':sorted(actual-expected),'missed':sorted(expected-actual)})
    for count in counts.values():
        count['precision']=count['tp']/(count['tp']+count['fp']) if count['tp']+count['fp'] else None
        count['recall']=count['tp']/(count['tp']+count['fn']) if count['tp']+count['fn'] else None
    return {'engine':'2.0.0','unit':'document_rule_presence','split':split,'documents':len(selected),
            'provenance':sorted({r['provenance'] for r in selected}), 'rules':dict(counts),'outcomes':outcomes,
            'authorship_accuracy':None,'notice':'Descriptive sample metrics only. No population accuracy or external detector agreement established.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('corpus');parser.add_argument('--split',default='test');args=parser.parse_args()
    data=Path(args.corpus).read_bytes()
    result=evaluate([json.loads(line) for line in data.decode().splitlines() if line.strip()],args.split)
    result['dataset_sha256']=hashlib.sha256(data).hexdigest()
    print(json.dumps(result,ensure_ascii=False,indent=2))
