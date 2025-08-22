import React from 'react';
import styles from '@/app/model/assets/Train.module.scss';

interface TrainerConfig {
    use_sfttrainer: boolean;
    use_dpotrainer: boolean;
    use_ppotrainer: boolean;
    use_grpotrainer: boolean;
    use_custom_kl_sfttrainer: boolean;
    dpo_loss_type: string;
    dpo_beta: number;
    dpo_label_smoothing: number;
    use_deepspeed: boolean;
    ds_preset: string;
    ds_jsonpath: string;
    ds_stage2_bucket_size: number;
    ds_stage3_sub_group_size: number;
    ds_stage3_max_live_parameters: number;
    ds_stage3_max_reuse_distance: number;
    use_peft: boolean;
    peft_type: string;
    lora_target_modules: string;
    lora_r: number;
    lora_alpha: number;
    lora_dropout: number;
    lora_modules_to_save: string;
    adalora_init_r: number;
    adalora_target_r: number;
    adalora_tinit: number;
    adalora_tfinal: number;
    adalora_delta_t: number;
    adalora_orth_reg_weight: number;
    ia3_target_modules: string;
    feedforward_modules: string;
    adapter_layers: number;
    adapter_len: number;
    vera_target_modules: string;
    ln_target_modules: string;
    optim: string;
    adam_beta1: number;
    adam_beta2: number;
    adam_epsilon: number;
    learning_rate: number;
    num_train_epochs: number;
    max_grad_norm: number;
    per_device_train_batch_size: number;
    per_device_eval_batch_size: number;
    gradient_accumulation_steps: number;
    warmup_ratio: number;
    weight_decay: number;
    bf16: boolean;
    fp16: boolean;
    gradient_checkpointing: boolean;
    ddp_find_unused_parameters: boolean;
}

interface TrainerCategoryProps {
    trainerConfig: TrainerConfig;
    handleTrainerConfigChange: (field: keyof TrainerConfig, value: any) => void;
    availableTrainers: string[];
    trainingMethod: string;
}

const TrainerCategory: React.FC<TrainerCategoryProps> = ({
    trainerConfig,
    handleTrainerConfigChange,
    availableTrainers,
    trainingMethod
}) => {
    return (
        <div className={styles.configSection}>
            <div className={styles.configForm}>
                {/* 트레이너 타입 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>트레이너 타입</label>
                    </div>
                    <div className={styles.checkboxGroup}>
                        <label className={`${styles.checkboxLabel} ${
                            availableTrainers.includes('use_sfttrainer') ? styles.highlighted : styles.disabled
                        }`}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_sfttrainer}
                                onChange={(e) => handleTrainerConfigChange('use_sfttrainer', e.target.checked)}
                                className={styles.checkbox}
                                disabled={!availableTrainers.includes('use_sfttrainer')}
                            />
                            SFT Trainer
                        </label>
                        <label className={`${styles.checkboxLabel} ${
                            availableTrainers.includes('use_custom_kl_sfttrainer') ? styles.highlighted : styles.disabled
                        }`}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_custom_kl_sfttrainer}
                                onChange={(e) => handleTrainerConfigChange('use_custom_kl_sfttrainer', e.target.checked)}
                                className={styles.checkbox}
                                disabled={!availableTrainers.includes('use_custom_kl_sfttrainer')}
                            />
                            Custom KL SFT Trainer
                        </label>
                        <label className={`${styles.checkboxLabel} ${
                            availableTrainers.includes('use_dpotrainer') ? styles.highlighted : styles.disabled
                        }`}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_dpotrainer}
                                onChange={(e) => handleTrainerConfigChange('use_dpotrainer', e.target.checked)}
                                className={styles.checkbox}
                                disabled={!availableTrainers.includes('use_dpotrainer')}
                            />
                            DPO Trainer
                        </label>
                        {/* <label className={`${styles.checkboxLabel} ${
                            availableTrainers.includes('use_ppotrainer') ? styles.highlighted : styles.disabled
                        }`}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_ppotrainer}
                                onChange={(e) => handleTrainerConfigChange('use_ppotrainer', e.target.checked)}
                                className={styles.checkbox}
                                disabled={!availableTrainers.includes('use_ppotrainer')}
                            />
                            PPO Trainer
                        </label> */}
                        <label className={`${styles.checkboxLabel} ${
                            availableTrainers.includes('use_grpotrainer') ? styles.highlighted : styles.disabled
                        }`}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_grpotrainer}
                                onChange={(e) => handleTrainerConfigChange('use_grpotrainer', e.target.checked)}
                                className={styles.checkbox}
                                disabled={!availableTrainers.includes('use_grpotrainer')}
                            />
                            GRPO Trainer
                        </label>

                    </div>
                </div>

                {/* DPO Trainer 설정 */}
                {trainerConfig.use_dpotrainer && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>DPO Trainer 설정</label>
                        </div>
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>DPO Loss Type</label>
                                <select
                                    value={trainerConfig.dpo_loss_type}
                                    onChange={(e) => handleTrainerConfigChange('dpo_loss_type', e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="sigmoid">Sigmoid</option>
                                    <option value="hinge">Hinge</option>
                                    <option value="ipo">IPO</option>
                                    <option value="kto_pair">KTO Pair</option>
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>DPO Beta</label>
                                <input
                                    type="number"
                                    value={trainerConfig.dpo_beta}
                                    onChange={(e) => handleTrainerConfigChange('dpo_beta', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>DPO Label Smoothing</label>
                                <input
                                    type="number"
                                    value={trainerConfig.dpo_label_smoothing}
                                    onChange={(e) => handleTrainerConfigChange('dpo_label_smoothing', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* DeepSpeed 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>DeepSpeed 설정</label>
                    </div>
                    <div className={styles.formRow}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_deepspeed}
                                onChange={(e) => handleTrainerConfigChange('use_deepspeed', e.target.checked)}
                                className={styles.checkbox}
                            />
                            DeepSpeed 사용
                        </label>
                    </div>

                    {trainerConfig.use_deepspeed && (
                        <>
                            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>DeepSpeed Preset</label>
                                    <select
                                        value={trainerConfig.ds_preset}
                                        onChange={(e) => handleTrainerConfigChange('ds_preset', e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="zero-2">Zero-2</option>
                                        <option value="zero-3">Zero-3</option>
                                    </select>
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>DS JSON 경로</label>
                                    <input
                                        type="text"
                                        value={trainerConfig.ds_jsonpath}
                                        onChange={(e) => handleTrainerConfigChange('ds_jsonpath', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="[Optional] DeepSpeed JSON 설정 파일 경로"
                                    />
                                </div>
                            </div>
                            {trainerConfig.ds_preset === 'zero-2' && (
                                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>DS Stage2 Bucket Size</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.ds_stage2_bucket_size}
                                            onChange={(e) => handleTrainerConfigChange('ds_stage2_bucket_size', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            placeholder="5e8"
                                        />
                                    </div>
                                </div>
                            )}
                            {trainerConfig.ds_preset === 'zero-3' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>DS Stage3 Sub Group Size</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.ds_stage3_sub_group_size}
                                            onChange={(e) => handleTrainerConfigChange('ds_stage3_sub_group_size', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            placeholder="1e9"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>DS Stage3 Max Live Parameters</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.ds_stage3_max_live_parameters}
                                            onChange={(e) => handleTrainerConfigChange('ds_stage3_max_live_parameters', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            placeholder="1e6"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>DS Stage3 Max Reuse Distance</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.ds_stage3_max_reuse_distance}
                                            onChange={(e) => handleTrainerConfigChange('ds_stage3_max_reuse_distance', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            placeholder="1e6"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* PEFT 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>PEFT 설정</label>
                    </div>
                    <div className={styles.formRow}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={trainerConfig.use_peft}
                                onChange={(e) => handleTrainerConfigChange('use_peft', e.target.checked)}
                                className={styles.checkbox}
                            />
                            PEFT 사용
                        </label>
                    </div>

                    {trainerConfig.use_peft && (
                        <>
                            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>PEFT 타입</label>
                                    <select
                                        value={trainerConfig.peft_type}
                                        onChange={(e) => handleTrainerConfigChange('peft_type', e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="lora">LoRA</option>
                                        <option value="adalora">AdaLoRA</option>
                                        <option value="ia3">IA3</option>
                                        <option value="vera">Vera</option>
                                    </select>
                                </div>
                            </div>

                            {/* LoRA 설정 */}
                            {trainerConfig.peft_type === 'lora' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>LoRA 타겟 모듈</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.lora_target_modules}
                                            onChange={(e) => handleTrainerConfigChange('lora_target_modules', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="예: q_proj,k_proj,v_proj"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>LoRA Rank (r)</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.lora_r}
                                            onChange={(e) => handleTrainerConfigChange('lora_r', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="8"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>LoRA Alpha</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.lora_alpha}
                                            onChange={(e) => handleTrainerConfigChange('lora_alpha', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="16"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>LoRA Dropout</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.lora_dropout}
                                            onChange={(e) => handleTrainerConfigChange('lora_dropout', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            placeholder="0.05"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>LoRA Modules to Save</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.lora_modules_to_save}
                                            onChange={(e) => handleTrainerConfigChange('lora_modules_to_save', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="[Optional] 저장할 모듈 지정"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* AdaLoRA 설정 */}
                            {trainerConfig.peft_type === 'adalora' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA Init R</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_init_r}
                                            onChange={(e) => handleTrainerConfigChange('adalora_init_r', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="12"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA Target R</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_target_r}
                                            onChange={(e) => handleTrainerConfigChange('adalora_target_r', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="4"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA T Init</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_tinit}
                                            onChange={(e) => handleTrainerConfigChange('adalora_tinit', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="50"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA T Final</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_tfinal}
                                            onChange={(e) => handleTrainerConfigChange('adalora_tfinal', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA Delta T</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_delta_t}
                                            onChange={(e) => handleTrainerConfigChange('adalora_delta_t', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="10"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>AdaLoRA Orth Reg Weight</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adalora_orth_reg_weight}
                                            onChange={(e) => handleTrainerConfigChange('adalora_orth_reg_weight', parseFloat(e.target.value))}
                                            className={styles.formInput}
                                            step="0.1"
                                            min="0"
                                            placeholder="0.5"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* IA3 설정 */}
                            {trainerConfig.peft_type === 'ia3' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>IA3 타겟 모듈</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.ia3_target_modules}
                                            onChange={(e) => handleTrainerConfigChange('ia3_target_modules', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="예: k_proj,v_proj,down_proj"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Feedforward 모듈</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.feedforward_modules}
                                            onChange={(e) => handleTrainerConfigChange('feedforward_modules', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="예: down_proj"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Adapter Layers</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adapter_layers}
                                            onChange={(e) => handleTrainerConfigChange('adapter_layers', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="30"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Adapter Length</label>
                                        <input
                                            type="number"
                                            value={trainerConfig.adapter_len}
                                            onChange={(e) => handleTrainerConfigChange('adapter_len', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                            placeholder="16"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Vera 설정 */}
                            {trainerConfig.peft_type === 'vera' && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Vera 타겟 모듈</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.vera_target_modules}
                                            onChange={(e) => handleTrainerConfigChange('vera_target_modules', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="예: q_proj,k_proj,v_proj"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Layer Norm 타겟 모듈</label>
                                        <input
                                            type="text"
                                            value={trainerConfig.ln_target_modules}
                                            onChange={(e) => handleTrainerConfigChange('ln_target_modules', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="예: input_layernorm,post_attention_layernorm"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Optimizer 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>Optimizer 설정</label>
                    </div>
                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Optimizer</label>
                            <select
                                value={trainerConfig.optim}
                                onChange={(e) => handleTrainerConfigChange('optim', e.target.value)}
                                className={styles.formSelect}
                            >
                                <option value="adamw_torch">AdamW</option>
                                <option value="adamw_torch_fused">AdamW Fused</option>
                                <option value="stable_adamw">Stable AdamW</option>
                                <option value="sgd">SGD</option>
                                <option value="adafactor">Adafactor</option>
                            </select>
                        </div>
                    </div>

                    {/* Adam 관련 설정 (adamw 옵션일 때만 표시) */}
                    {(trainerConfig.optim.includes('adamw')) && (
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Adam Beta1</label>
                                <input
                                    type="number"
                                    value={trainerConfig.adam_beta1}
                                    onChange={(e) => handleTrainerConfigChange('adam_beta1', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    placeholder="0.900"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Adam Beta2</label>
                                <input
                                    type="number"
                                    value={trainerConfig.adam_beta2}
                                    onChange={(e) => handleTrainerConfigChange('adam_beta2', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    placeholder="0.990"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Adam Epsilon</label>
                                <input
                                    type="number"
                                    value={trainerConfig.adam_epsilon}
                                    onChange={(e) => handleTrainerConfigChange('adam_epsilon', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="1e-8"
                                    min="0"
                                    placeholder="1e-7"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 훈련 하이퍼파라미터 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>훈련 하이퍼파라미터</label>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Learning Rate</label>
                            <input
                                type="number"
                                value={trainerConfig.learning_rate}
                                onChange={(e) => handleTrainerConfigChange('learning_rate', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="1e-5"
                                min="0"
                                placeholder="2e-5"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Epochs</label>
                            <input
                                type="number"
                                value={trainerConfig.num_train_epochs}
                                onChange={(e) => handleTrainerConfigChange('num_train_epochs', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="1"
                                placeholder="1"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Max Grad Norm</label>
                            <input
                                type="number"
                                value={trainerConfig.max_grad_norm}
                                onChange={(e) => handleTrainerConfigChange('max_grad_norm', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="0.1"
                                min="0"
                                placeholder="1"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Batch Size (Train)</label>
                            <input
                                type="number"
                                value={trainerConfig.per_device_train_batch_size}
                                onChange={(e) => handleTrainerConfigChange('per_device_train_batch_size', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="1"
                                placeholder="4"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Batch Size (Eval)</label>
                            <input
                                type="number"
                                value={trainerConfig.per_device_eval_batch_size}
                                onChange={(e) => handleTrainerConfigChange('per_device_eval_batch_size', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="1"
                                placeholder="4"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Gradient Accumulation Steps</label>
                            <input
                                type="number"
                                value={trainerConfig.gradient_accumulation_steps}
                                onChange={(e) => handleTrainerConfigChange('gradient_accumulation_steps', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="1"
                                placeholder="16"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Warmup Ratio</label>
                            <input
                                type="number"
                                value={trainerConfig.warmup_ratio}
                                onChange={(e) => handleTrainerConfigChange('warmup_ratio', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="0.1"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Weight Decay</label>
                            <input
                                type="number"
                                value={trainerConfig.weight_decay}
                                onChange={(e) => handleTrainerConfigChange('weight_decay', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="0.01"
                                min="0"
                                placeholder="0.01"
                            />
                        </div>
                    </div>

                    {/* 정밀도 및 기타 옵션 */}
                    <div className={styles.formRow}>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={trainerConfig.bf16}
                                    onChange={(e) => handleTrainerConfigChange('bf16', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                BF16 사용
                            </label>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={trainerConfig.fp16}
                                    onChange={(e) => handleTrainerConfigChange('fp16', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                FP16 사용
                            </label>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={trainerConfig.gradient_checkpointing}
                                    onChange={(e) => handleTrainerConfigChange('gradient_checkpointing', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                Gradient Checkpointing
                            </label>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={trainerConfig.ddp_find_unused_parameters}
                                    onChange={(e) => handleTrainerConfigChange('ddp_find_unused_parameters', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                DDP Find Unused Parameters
                            </label>
                        </div>
                    </div>
                </div>

                {/* 추가 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>추가 설정</label>
                    </div>
                    <div className={styles.formGrid}>
                        {/* <div className={styles.formField}>
                            <label className={styles.formLabel}>라벨 수</label>
                            <input
                                type="number"
                                value={trainerConfig.num_labels}
                                onChange={(e) => handleTrainerConfigChange('num_labels', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="1"
                                placeholder="17"
                            />
                        </div> */}
                        {/* <div className={styles.formField}>
                            <label className={styles.formLabel}>MLM 확률</label>
                            <input
                                type="number"
                                value={trainerConfig.mlm_probability}
                                onChange={(e) => handleTrainerConfigChange('mlm_probability', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="0.2"
                            />
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainerCategory;
